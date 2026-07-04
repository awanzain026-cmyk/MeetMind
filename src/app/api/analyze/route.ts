import { createCompletionWithRetry } from "@/lib/sodeom";
import type { ActionItem, MeetingAnalysis } from "@/lib/types";

interface AnalyzeRequest {
  transcript: string;
  title?: string;
  depth: "quick" | "standard" | "deep";
}

const AGENT_IDS = [
  "transcript-processor",
  "action-item-extractor",
  "sentiment-analyzer",
  "summary-writer",
  "followup-email",
] as const;

function validateRequest(body: unknown): AnalyzeRequest {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const data = body as Record<string, unknown>;

  if (typeof data.transcript !== "string" || !data.transcript.trim()) {
    throw new ValidationError("transcript is required and must be a non-empty string");
  }

  const wordCount = data.transcript.trim().split(/\s+/).length;
  if (wordCount < 50) {
    throw new ValidationError(
      `Transcript too short (${wordCount} words). Minimum 50 words required.`,
    );
  }

  const depth = data.depth;
  if (depth !== "quick" && depth !== "standard" && depth !== "deep") {
    throw new ValidationError('depth must be "quick", "standard", or "deep"');
  }

  return {
    transcript: data.transcript.trim(),
    title: typeof data.title === "string" ? data.title.trim() : undefined,
    depth,
  };
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function parseJSON<T>(text: string, label: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error(`[Analyze] Failed to parse ${label} JSON:`, cleaned.slice(0, 200));
    throw new Error(`Failed to parse ${label} output as JSON`);
  }
}

export async function POST(request: Request) {
  let parsedRequest: AnalyzeRequest;

  try {
    const body = await request.json();
    parsedRequest = validateRequest(body);
  } catch (error) {
    const message =
      error instanceof ValidationError
        ? error.message
        : "Invalid request body";
    return Response.json({ error: message }, { status: 400 });
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 120_000);

  request.signal.addEventListener("abort", () => {
    clearTimeout(timeout);
    abortController.abort();
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          /* stream closed */
        }
      };

      const startedAt = Date.now();

      try {
        console.log("[Analyze] Starting agent pipeline...");

        let cleanedTranscript = parsedRequest.transcript;
        let meetingTitle = parsedRequest.title ?? "Untitled Meeting";
        let meetingDate = "";
        let participants: string[] = [];
        let topics: string[] = [];
        let actionItems: ActionItem[] = [];
        let sentiment = "";
        let sentimentScore = 50;
        let concerns: string[] = [];
        let summary = "";
        let decisions: string[] = [];
        let followUpEmail = "";

        const depthInstruction =
          parsedRequest.depth === "quick"
            ? "Provide a concise, high-level analysis. Be brief."
            : parsedRequest.depth === "deep"
              ? "Provide a thorough, detailed analysis with rich context. Be exhaustive."
              : "Provide a balanced, standard analysis.";

        // --- AGENT 1: Transcript Processor ---
        {
          const agentId = AGENT_IDS[0];
          console.log(`[Analyze] Starting agent: ${agentId}`);
          send("agent_start", { agent: agentId });

          const agentStart = Date.now();
          const systemPrompt = `You are a meeting transcript processor. Extract key metadata and clean the transcript.

${depthInstruction}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "cleanedTranscript": "the cleaned, structured transcript text",
  "title": "inferred meeting title",
  "date": "inferred date or empty string",
  "durationEstimate": "estimated duration or empty string",
  "participants": ["list of participant names"],
  "topics": ["main topics discussed"]
}`;

          const userMessage = `Process this meeting transcript:\n\n${parsedRequest.transcript}`;

          const raw = await createCompletionWithRetry(
            [{ role: "user", content: userMessage }],
            systemPrompt,
          );

          const result = parseJSON<{
            cleanedTranscript: string;
            title: string;
            date: string;
            durationEstimate: string;
            participants: string[];
            topics: string[];
          }>(raw, "transcript-processor");

          cleanedTranscript = result.cleanedTranscript ?? cleanedTranscript;
          meetingTitle = result.title ?? meetingTitle;
          meetingDate = result.date ?? "";
          participants = result.participants ?? [];
          topics = result.topics ?? [];
          const duration = Date.now() - agentStart;
          console.log(`[Analyze] Agent ${agentId} done in ${duration}ms`);

          send("agent_done", {
            agent: agentId,
            output: { cleanedTranscript, title: meetingTitle, topics, participants },
            duration,
          });
        }

        // --- AGENT 2: Action Item Extractor ---
        {
          const agentId = AGENT_IDS[1];
          console.log(`[Analyze] Starting agent: ${agentId}`);
          send("agent_start", { agent: agentId });

          const agentStart = Date.now();
          const systemPrompt = `You are an expert at identifying action items in meetings. Extract every task, commitment, and next step.

${depthInstruction}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "actionItems": [
    {
      "id": "unique-string",
      "task": "description of the task",
      "owner": "person responsible",
      "deadline": "deadline date or 'TBD'",
      "priority": "high" | "medium" | "low"
    }
  ]
}`;

          const userMessage = `Extract action items from this meeting transcript:\n\n${cleanedTranscript}`;

          const raw = await createCompletionWithRetry(
            [{ role: "user", content: userMessage }],
            systemPrompt,
          );

          const result = parseJSON<{ actionItems: ActionItem[] }>(
            raw,
            "action-item-extractor",
          );

          actionItems = result.actionItems ?? [];

          const duration = Date.now() - agentStart;
          console.log(
            `[Analyze] Agent ${agentId} done in ${duration}ms — ${actionItems.length} items`,
          );

          send("agent_done", {
            agent: agentId,
            output: { actionItems },
            duration,
          });
        }

        // --- AGENT 3: Sentiment & Tone Analyzer ---
        {
          const agentId = AGENT_IDS[2];
          console.log(`[Analyze] Starting agent: ${agentId}`);
          send("agent_start", { agent: agentId });

          const agentStart = Date.now();
          const systemPrompt = `Analyze the sentiment and tone of this meeting. Identify positive moments, concerns, and overall team morale.

${depthInstruction}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "overallSentiment": "positive" | "neutral" | "negative",
  "score": 0-100,
  "keyMoments": ["list of notable moments with sentiment"],
  "concerns": ["list of concerns or tensions detected"]
}`;

          const userMessage = `Analyze the sentiment of this meeting transcript:\n\n${cleanedTranscript}`;

          const raw = await createCompletionWithRetry(
            [{ role: "user", content: userMessage }],
            systemPrompt,
          );

          const result = parseJSON<{
            overallSentiment: string;
            score: number;
            keyMoments: string[];
            concerns: string[];
          }>(raw, "sentiment-analyzer");

          sentiment = result.overallSentiment ?? "neutral";
          sentimentScore = result.score ?? 50;
          concerns = result.concerns ?? [];

          const duration = Date.now() - agentStart;
          console.log(
            `[Analyze] Agent ${agentId} done in ${duration}ms — sentiment: ${sentiment} (${sentimentScore})`,
          );

          send("agent_done", {
            agent: agentId,
            output: {
              overallSentiment: sentiment,
              score: sentimentScore,
              concerns,
            },
            duration,
          });
        }

        // --- AGENT 4: Meeting Summary Writer ---
        {
          const agentId = AGENT_IDS[3];
          console.log(`[Analyze] Starting agent: ${agentId}`);
          send("agent_start", { agent: agentId });

          const agentStart = Date.now();
          const systemPrompt = `Write a comprehensive yet concise meeting summary. Include key decisions made, important discussions, and outcomes.

${depthInstruction}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "summary": "Full formatted markdown summary of the meeting",
  "decisions": ["list of key decisions made"]
}`;

          const actionItemsText = actionItems
            .map(
              (a) =>
                `- ${a.task} (Owner: ${a.owner}, Priority: ${a.priority})`,
            )
            .join("\n");

          const userMessage = `Write a summary for this meeting.

Transcript:
${cleanedTranscript}

Action Items:
${actionItemsText || "No action items extracted."}

Sentiment: ${sentiment} (Score: ${sentimentScore}/100)
Concerns: ${concerns.join(", ") || "None identified"}`;

          const raw = await createCompletionWithRetry(
            [{ role: "user", content: userMessage }],
            systemPrompt,
          );

          const result = parseJSON<{
            summary: string;
            decisions: string[];
          }>(raw, "summary-writer");

          summary = result.summary ?? "No summary generated.";
          decisions = result.decisions ?? [];

          const duration = Date.now() - agentStart;
          console.log(
            `[Analyze] Agent ${agentId} done in ${duration}ms — ${decisions.length} decisions`,
          );

          send("agent_done", {
            agent: agentId,
            output: { summary, decisions },
            duration,
          });
        }

        // --- AGENT 5: Follow-up Email Generator ---
        {
          const agentId = AGENT_IDS[4];
          console.log(`[Analyze] Starting agent: ${agentId}`);
          send("agent_start", { agent: agentId });

          const agentStart = Date.now();
          const systemPrompt = `Write a professional follow-up email for this meeting. Include summary, decisions, and action items with owners.

${depthInstruction}

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "to": "recipient email or 'team@company.com'",
  "subject": "email subject line",
  "body": "full email body text"
}`;

          const actionItemsText = actionItems
            .map(
              (a, i) =>
                `${i + 1}. ${a.task} — Owner: ${a.owner}, Due: ${a.deadline} [${a.priority}]`,
            )
            .join("\n");

          const decisionsText = decisions
            .map((d) => `- ${d}`)
            .join("\n");

          const userMessage = `Draft a follow-up email for this meeting.

Meeting Title: ${meetingTitle}
Date: ${meetingDate || "Today"}

Summary:
${summary}

Key Decisions:
${decisionsText || "None recorded"}

Action Items:
${actionItemsText || "None identified"}

Sentiment: ${sentiment}`;

          const raw = await createCompletionWithRetry(
            [{ role: "user", content: userMessage }],
            systemPrompt,
          );

          const result = parseJSON<{
            to: string;
            subject: string;
            body: string;
          }>(raw, "followup-email");

          followUpEmail = result.body ?? raw;

          const duration = Date.now() - agentStart;
          console.log(`[Analyze] Agent ${agentId} done in ${duration}ms`);

          send("agent_done", {
            agent: agentId,
            output: {
              to: result.to ?? "team@company.com",
              subject: result.subject ?? `Meeting Follow-up: ${meetingTitle}`,
              body: followUpEmail,
            },
            duration,
          });
        }

        // --- COMPLETE ---
        const totalDuration = Date.now() - startedAt;
        console.log(`[Analyze] Pipeline complete in ${totalDuration}ms`);

        const result: MeetingAnalysis = {
          transcript: parsedRequest.transcript,
          summary,
          actionItems,
          decisions,
          sentiment: `${sentiment} (${sentimentScore}/100)`,
          followUpEmail,
          tasks: actionItems.map((a) => ({
            id: a.id,
            title: a.task,
            assignee: a.owner,
            dueDate: a.deadline,
            status: "todo",
          })),
          agents: AGENT_IDS.map((id) => ({
            id,
            name: "",
            role: "",
            status: "done" as const,
          })),
        };

        send("complete", result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An unknown error occurred";
        const stack = error instanceof Error ? error.stack : undefined;
        console.error("[Analyze] Pipeline failed:", message);
        if (stack) console.error("[Analyze] Stack:", stack);
        send("error", { message });
      } finally {
        clearTimeout(timeout);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
