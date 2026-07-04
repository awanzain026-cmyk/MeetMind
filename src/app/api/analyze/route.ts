import type { ActionItem, MeetingAnalysis } from "@/lib/types";

const SODEOM_URL = "https://sodeom.com/v1/chat/completions";
const BEARER = "free";
const MODEL = "gpt-4o";

function generateId(): string {
  return `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function sseError(msg: string): string {
  return sseEvent("error", { message: msg });
}

function validate(body: unknown): { transcript: string; depth: string } {
  if (!body || typeof body !== "object") throw new Error("Request body must be a JSON object");
  const data = body as Record<string, unknown>;
  if (typeof data.transcript !== "string" || !data.transcript.trim()) throw new Error("transcript is required");
  const words = data.transcript.trim().split(/\s+/).length;
  if (words < 50) throw new Error(`Transcript too short (${words} words). Minimum 50 required.`);
  const depth = data.depth;
  if (depth !== "quick" && depth !== "standard" && depth !== "deep") throw new Error('depth must be "quick", "standard", or "deep"');
  return { transcript: data.transcript.trim(), depth };
}

async function callAI(systemPrompt: string, userContent: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(SODEOM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${BEARER}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Sodeom API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data: unknown = await res.json();
  if (!data || typeof data !== "object") throw new Error("Invalid API response");
  const choices = (data as Record<string, unknown>).choices;
  if (!Array.isArray(choices) || !choices[0]) throw new Error("No choices in response");
  const message = (choices[0] as Record<string, unknown>).message;
  if (!message || typeof message !== "object") throw new Error("No message in choice");
  const content = (message as Record<string, unknown>).content;
  if (typeof content !== "string") throw new Error("No content in message");
  return content;
}

function extractJSON(text: string): string {
  const cleaned = text.trim();
  let attempt = cleaned.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
  try { JSON.parse(attempt); return attempt; } catch { /* next */ }
  const braceMatch = cleaned.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    attempt = braceMatch[0];
    try { JSON.parse(attempt); return attempt; } catch { /* next */ }
  }
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart >= 0) {
    attempt = cleaned.slice(jsonStart);
    const lastBrace = attempt.lastIndexOf("}");
    if (lastBrace >= 0) attempt = attempt.slice(0, lastBrace + 1);
    try { JSON.parse(attempt); return attempt; } catch { /* next */ }
  }
  return cleaned;
}

function parseJSON<T>(text: string, label: string): T | null {
  const extracted = extractJSON(text);
  try { return JSON.parse(extracted) as T; } catch {
    console.error(`[Analyze] Failed to parse ${label}:`, extracted.slice(0, 300));
    return null;
  }
}

function extractActionItemsFallback(raw: string, transcript: string): ActionItem[] {
  const lines = transcript.split("\n");
  const items: ActionItem[] = [];
  const patterns = [
    /(?:^|\n)\s*(?:\d+[\.\)]\s*)?(\w+)\s*(?:—|[-–]|will|can|should|could|needs?\s+to)\s*(.+?)(?:\.|$)/gi,
    /(?:^|\n)\s*(?:\d+[\.\)]\s*)?(?:-\s+)?(.+?)\s*[–—]\s*(\w+)/gi,
  ];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(transcript)) !== null) {
      const owner = m[1]?.trim() || "Unassigned";
      const task = m[2]?.trim() || m[1]?.trim() || "";
      if (task.length > 5 && !items.some((i) => i.task === task)) {
        items.push({ id: generateId(), task, owner, deadline: "TBD", priority: "medium" as const });
      }
    }
  }
  return items.slice(0, 10);
}

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 120000);

      const send = (event: string, data: unknown) => {
        try { controller.enqueue(encoder.encode(sseEvent(event, data))); } catch {}
      };

      try {
        const body = await request.json().catch(() => null);
        const { transcript, depth } = validate(body);

        const depthInstr = depth === "quick"
          ? "Provide a concise, high-level analysis. Be brief."
          : depth === "deep"
            ? "Provide a thorough, detailed analysis with rich context. Be exhaustive."
            : "Provide a balanced, standard analysis.";

        // Agent 1
        send("agent-status", { id: "transcript-processor", status: "running" });
        let cleanedTranscript = transcript;
        let meetingTitle = "Untitled Meeting";
        try {
          const raw1 = await callAI(
            `You are a meeting transcript processor. Extract key metadata and clean the transcript.\n${depthInstr}\nReturn ONLY valid JSON with: {"cleanedTranscript":"...","title":"...","date":"...","participants":["..."],"topics":["..."]}`,
            `Process this meeting transcript:\n\n${transcript}`,
            abortController.signal,
          );
          const r1 = parseJSON<{ cleanedTranscript: string; title: string; date: string; participants: string[]; topics: string[] }>(raw1, "transcript-processor");
          if (r1) {
            cleanedTranscript = r1.cleanedTranscript || transcript;
            meetingTitle = r1.title || "Untitled Meeting";
          }
        } catch (e) { console.error("[Agent 1] Transcript processor error:", e); }
        send("agent-status", { id: "transcript-processor", status: "done" });

        // Agent 2
        send("agent-status", { id: "action-item-extractor", status: "running" });
        let actionItems: ActionItem[] = [];
        try {
          const raw2 = await callAI(
            `You are an expert at identifying action items in meetings. Extract every task, commitment, and next step. You MUST return ONLY valid JSON.\n${depthInstr}\nReturn ONLY valid JSON with: {"actionItems":[{"id":"...","task":"...","owner":"...","deadline":"...","priority":"high|medium|low"}]}`,
            `Extract action items from this meeting transcript:\n\n${cleanedTranscript}`,
            abortController.signal,
          );
          const r2 = parseJSON<{ actionItems: ActionItem[] }>(raw2, "action-item-extractor");
          if (r2 && Array.isArray(r2.actionItems)) actionItems = r2.actionItems;
          if (actionItems.length === 0) actionItems = extractActionItemsFallback(raw2, cleanedTranscript);
        } catch (e) {
          console.error("[Agent 2] Action item extractor error:", e);
          actionItems = extractActionItemsFallback("", cleanedTranscript);
        }
        send("agent-status", { id: "action-item-extractor", status: "done" });

        // Agent 3
        send("agent-status", { id: "sentiment-analyzer", status: "running" });
        let sentiment = "neutral";
        let sentimentScore = 50;
        let concerns: string[] = [];
        try {
          const raw3 = await callAI(
            `Analyze the sentiment and tone of this meeting. Identify positive moments, concerns, and overall team morale.\n${depthInstr}\nReturn ONLY valid JSON with: {"overallSentiment":"positive|neutral|negative","score":0-100,"keyMoments":["..."],"concerns":["..."]}`,
            `Analyze the sentiment of this meeting transcript:\n\n${cleanedTranscript}`,
            abortController.signal,
          );
          const r3 = parseJSON<{ overallSentiment: string; score: number; keyMoments: string[]; concerns: string[] }>(raw3, "sentiment-analyzer");
          if (r3) {
            sentiment = r3.overallSentiment || "neutral";
            sentimentScore = r3.score ?? 50;
            concerns = r3.concerns || [];
          }
        } catch (e) { console.error("[Agent 3] Sentiment analyzer error:", e); }
        send("agent-status", { id: "sentiment-analyzer", status: "done" });

        // Agent 4
        send("agent-status", { id: "summary-writer", status: "running" });
        let summary = "No summary generated.";
        let decisions: string[] = [];
        try {
          const actionText = actionItems.map((a) => `- ${a.task} (Owner: ${a.owner}, Priority: ${a.priority})`).join("\n");
          const raw4 = await callAI(
            `Write a comprehensive yet concise meeting summary. Include key decisions made, important discussions, and outcomes.\n${depthInstr}\nReturn ONLY valid JSON with: {"summary":"...","decisions":["..."]}`,
            `Write a summary for this meeting.\n\nTranscript:\n${cleanedTranscript}\n\nAction Items:\n${actionText || "None"}\n\nSentiment: ${sentiment} (Score: ${sentimentScore}/100)\nConcerns: ${concerns.join(", ") || "None"}`,
            abortController.signal,
          );
          const r4 = parseJSON<{ summary: string; decisions: string[] }>(raw4, "summary-writer");
          if (r4) { summary = r4.summary || "No summary generated."; decisions = r4.decisions || []; }
        } catch (e) { console.error("[Agent 4] Summary writer error:", e); }
        send("agent-status", { id: "summary-writer", status: "done" });

        // Agent 5
        send("agent-status", { id: "followup-email", status: "running" });
        let followUpEmail = "Follow-up email generation failed.";
        try {
          const actionText2 = actionItems.map((a, i) => `${i + 1}. ${a.task} — Owner: ${a.owner}, Due: ${a.deadline} [${a.priority}]`).join("\n");
          const decisionsText = decisions.map((d) => `- ${d}`).join("\n");
          const raw5 = await callAI(
            `Write a professional follow-up email for this meeting. Include summary, decisions, and action items with owners.\n${depthInstr}\nReturn ONLY valid JSON with: {"to":"...","subject":"...","body":"..."}`,
            `Draft a follow-up email for this meeting.\n\nMeeting Title: ${meetingTitle}\n\nSummary:\n${summary}\n\nKey Decisions:\n${decisionsText || "None"}\n\nAction Items:\n${actionText2 || "None"}\n\nSentiment: ${sentiment}`,
            abortController.signal,
          );
          const r5 = parseJSON<{ to: string; subject: string; body: string }>(raw5, "followup-email");
          if (r5 && r5.body) followUpEmail = r5.body;
          else if (raw5 && raw5.length > 50) followUpEmail = raw5;
        } catch (e) { console.error("[Agent 5] Email generator error:", e); }
        send("agent-status", { id: "followup-email", status: "done" });

        // Build result
        const result: MeetingAnalysis = {
          transcript,
          summary,
          actionItems,
          decisions,
          sentiment: `${sentiment} (${sentimentScore}/100)`,
          followUpEmail,
          tasks: actionItems.map((a) => ({ id: a.id, title: a.task, assignee: a.owner, dueDate: a.deadline, status: "todo" })),
          agents: [
            { id: "transcript-processor", name: "Transcript Processor Agent", role: "Processes raw meeting transcripts into structured, clean text", status: "done" as const },
            { id: "action-item-extractor", name: "Action Item Extractor Agent", role: "Identifies and extracts action items, owners, and deadlines", status: "done" as const },
            { id: "sentiment-analyzer", name: "Sentiment & Tone Analyzer Agent", role: "Analyzes emotional tone, sentiment shifts, and engagement levels", status: "done" as const },
            { id: "summary-writer", name: "Meeting Summary Writer Agent", role: "Generates concise, structured meeting summaries", status: "done" as const },
            { id: "followup-email", name: "Follow-up Email Generator Agent", role: "Drafts professional follow-up emails based on meeting outcomes", status: "done" as const },
          ],
        };

        send("complete", { success: true, data: result });
      } catch (error) {
        const message = error instanceof DOMException && error.name === "AbortError"
          ? "API request timed out after 120s. Try a shorter transcript or Quick depth."
          : error instanceof Error ? error.message : "An unknown error occurred";
        console.error("[Analyze] Error:", message);
        send("error", { message });
      } finally {
        clearTimeout(timeout);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
