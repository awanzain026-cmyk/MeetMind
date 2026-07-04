import type { ActionItem, MeetingAnalysis } from "@/lib/types";

const SODEOM_URL = "https://sodeom.com/v1/chat/completions";
const BEARER = "free";
const MODEL = "gpt-4o";

function validate(body: unknown): { transcript: string; depth: string } {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object");
  }
  const data = body as Record<string, unknown>;
  if (typeof data.transcript !== "string" || !data.transcript.trim()) {
    throw new Error("transcript is required");
  }
  const words = data.transcript.trim().split(/\s+/).length;
  if (words < 50) {
    throw new Error(`Transcript too short (${words} words). Minimum 50 required.`);
  }
  const depth = data.depth;
  if (depth !== "quick" && depth !== "standard" && depth !== "deep") {
    throw new Error('depth must be "quick", "standard", or "deep"');
  }
  return { transcript: data.transcript.trim(), depth };
}

async function callAI(systemPrompt: string, userContent: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
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
      signal: controller.signal,
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
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("API request timed out after 60s. Try a shorter transcript or Quick depth.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJSON<T>(text: string, label: string): T {
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error(`[Analyze] Failed to parse ${label}:`, cleaned.slice(0, 300));
    throw new Error(`Failed to parse ${label} output as JSON`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { transcript, depth } = validate(body);

    const depthInstr =
      depth === "quick"
        ? "Provide a concise, high-level analysis. Be brief."
        : depth === "deep"
          ? "Provide a thorough, detailed analysis with rich context. Be exhaustive."
          : "Provide a balanced, standard analysis.";

    // Agent 1: Transcript Processor
    const raw1 = await callAI(
      `You are a meeting transcript processor. Extract key metadata and clean the transcript.\n${depthInstr}\nReturn ONLY valid JSON (no markdown) with: {"cleanedTranscript":"...","title":"...","date":"...","participants":["..."],"topics":["..."]}`,
      `Process this meeting transcript:\n\n${transcript}`,
    );
    const r1 = parseJSON<{
      cleanedTranscript: string;
      title: string;
      date: string;
      participants: string[];
      topics: string[];
    }>(raw1, "transcript-processor");

    const cleanedTranscript = r1.cleanedTranscript || transcript;
    const meetingTitle = r1.title || "Untitled Meeting";
    const participants = r1.participants || [];
    const topics = r1.topics || [];

    // Agent 2: Action Item Extractor
    const raw2 = await callAI(
      `You are an expert at identifying action items in meetings. Extract every task, commitment, and next step.\n${depthInstr}\nReturn ONLY valid JSON (no markdown) with: {"actionItems":[{"id":"...","task":"...","owner":"...","deadline":"...","priority":"high|medium|low"}]}`,
      `Extract action items from this meeting transcript:\n\n${cleanedTranscript}`,
    );
    const r2 = parseJSON<{ actionItems: ActionItem[] }>(raw2, "action-item-extractor");
    const actionItems = r2.actionItems || [];

    // Agent 3: Sentiment Analyzer
    const raw3 = await callAI(
      `Analyze the sentiment and tone of this meeting. Identify positive moments, concerns, and overall team morale.\n${depthInstr}\nReturn ONLY valid JSON (no markdown) with: {"overallSentiment":"positive|neutral|negative","score":0-100,"keyMoments":["..."],"concerns":["..."]}`,
      `Analyze the sentiment of this meeting transcript:\n\n${cleanedTranscript}`,
    );
    const r3 = parseJSON<{
      overallSentiment: string;
      score: number;
      keyMoments: string[];
      concerns: string[];
    }>(raw3, "sentiment-analyzer");
    const sentiment = r3.overallSentiment || "neutral";
    const sentimentScore = r3.score ?? 50;
    const concerns = r3.concerns || [];

    // Agent 4: Summary Writer
    const actionText = actionItems
      .map((a) => `- ${a.task} (Owner: ${a.owner}, Priority: ${a.priority})`)
      .join("\n");
    const raw4 = await callAI(
      `Write a comprehensive yet concise meeting summary. Include key decisions made, important discussions, and outcomes.\n${depthInstr}\nReturn ONLY valid JSON (no markdown) with: {"summary":"...","decisions":["..."]}`,
      `Write a summary for this meeting.\n\nTranscript:\n${cleanedTranscript}\n\nAction Items:\n${actionText || "None"}\n\nSentiment: ${sentiment} (Score: ${sentimentScore}/100)\nConcerns: ${concerns.join(", ") || "None"}`,
    );
    const r4 = parseJSON<{ summary: string; decisions: string[] }>(raw4, "summary-writer");
    const summary = r4.summary || "No summary generated.";
    const decisions = r4.decisions || [];

    // Agent 5: Follow-up Email
    const actionText2 = actionItems
      .map((a, i) => `${i + 1}. ${a.task} — Owner: ${a.owner}, Due: ${a.deadline} [${a.priority}]`)
      .join("\n");
    const decisionsText = decisions.map((d) => `- ${d}`).join("\n");
    const raw5 = await callAI(
      `Write a professional follow-up email for this meeting. Include summary, decisions, and action items with owners.\n${depthInstr}\nReturn ONLY valid JSON (no markdown) with: {"to":"...","subject":"...","body":"..."}`,
      `Draft a follow-up email for this meeting.\n\nMeeting Title: ${meetingTitle}\n\nSummary:\n${summary}\n\nKey Decisions:\n${decisionsText || "None"}\n\nAction Items:\n${actionText2 || "None"}\n\nSentiment: ${sentiment}`,
    );
    const r5 = parseJSON<{ to: string; subject: string; body: string }>(raw5, "followup-email");
    const followUpEmail = r5.body || raw5;

    const result: MeetingAnalysis = {
      transcript,
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
      agents: [
        { id: "transcript-processor", name: "Transcript Processor Agent", role: "Processes raw meeting transcripts into structured, clean text", status: "done" as const },
        { id: "action-item-extractor", name: "Action Item Extractor Agent", role: "Identifies and extracts action items, owners, and deadlines", status: "done" as const },
        { id: "sentiment-analyzer", name: "Sentiment & Tone Analyzer Agent", role: "Analyzes emotional tone, sentiment shifts, and engagement levels", status: "done" as const },
        { id: "summary-writer", name: "Meeting Summary Writer Agent", role: "Generates concise, structured meeting summaries", status: "done" as const },
        { id: "followup-email", name: "Follow-up Email Generator Agent", role: "Drafts professional follow-up emails based on meeting outcomes", status: "done" as const },
      ],
    };

    return Response.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("[Analyze] Error:", message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
