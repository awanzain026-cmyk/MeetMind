"use client";

import { useState } from "react";

const SAMPLE = `Meeting: Q3 Product Roadmap Planning
Date: March 15, 2024
Attendees: Sarah Chen (PM), Mike Torres (Eng), Lisa Park (Design), James Wilson (Marketing)

Sarah: Let's start with the Q3 roadmap. We need to finalize priorities by end of week.
Mike: The team has bandwidth for 2 major features. I'd recommend focusing on the analytics dashboard and the notification system.
Lisa: From a design perspective, the analytics dashboard has more UX debt. We should prioritize that.
Sarah: Agreed. Let's make the analytics dashboard our top priority.
Mike: I'll need 3 engineers for 6 weeks. We can start mid-April.
Sarah: Great. Also, we need to discuss the customer feedback about the mobile app performance.
James: Marketing has been hearing complaints about load times on Android.
Mike: We can allocate one engineer to optimize performance in parallel.
Sarah: Perfect. James, can you prepare a customer communication about the upcoming improvements?
James: Sure, I'll draft something by Friday.
Sarah: Let's schedule a follow-up for next Monday to review the engineering plan.
Mike: Works for me. I'll have the detailed breakdown ready by then.
Lisa: I'll have the design explorations done by Thursday for review.
Sarah: Excellent. Action items: Mike - engineering plan by Monday; Lisa - design explorations by Thursday; James - customer comms by Friday.`;

export default function AnalyzePage() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.trim(),
          title: "Meeting Analysis",
          depth: "quick",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string })?.error ?? `HTTP ${res.status}`,
        );
      }

      const text = await res.text();
      setResult(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[AnalyzePage]", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-white">
        Analyze Your Meeting
      </h1>
      <p className="mb-6 text-sm text-gray-400">
        Paste a transcript and let 5 AI agents analyze it.
      </p>

      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste your meeting transcript here..."
        rows={10}
        className="mb-4 w-full rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-white placeholder-gray-500"
      />

      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => {
            setTranscript(SAMPLE);
          }}
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
        >
          Load Sample
        </button>

        <button
          onClick={handleSubmit}
          disabled={!transcript.trim() || loading}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Meeting"}
        </button>
      </div>

      {loading && (
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-900 p-4 text-sm text-gray-400">
          Processing transcript with 5 AI agents...
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-900/30 p-4 text-sm text-red-300">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
          <h2 className="mb-3 text-lg font-semibold text-white">Response</h2>
          <pre className="overflow-auto whitespace-pre-wrap text-sm text-gray-300">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
