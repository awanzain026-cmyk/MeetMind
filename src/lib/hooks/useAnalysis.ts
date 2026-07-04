"use client";

import { useState, useCallback, useRef } from "react";
import type { Agent, MeetingAnalysis } from "@/lib/types";
import { AGENTS } from "@/lib/constants";

type Depth = "quick" | "standard" | "deep";

interface UseAnalysisReturn {
  agents: Agent[];
  currentAgent: string | null;
  results: MeetingAnalysis | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
  analyze: (
    transcript: string,
    title: string,
    depth: Depth,
  ) => Promise<void>;
  reset: () => void;
}

function createInitialAgents(): Agent[] {
  return AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
    status: "idle" as const,
  }));
}

export function useAnalysis(): UseAnalysisReturn {
  const [agents, setAgents] = useState<Agent[]>(createInitialAgents);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [results, setResults] = useState<MeetingAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setAgents(createInitialAgents());
    setCurrentAgent(null);
    setResults(null);
    setIsLoading(false);
    setError(null);
    setProgress(0);
  }, []);

  const analyze = useCallback(
    async (transcript: string, title: string, depth: Depth) => {
      reset();

      setIsLoading(true);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript, title, depth }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errBody: unknown = await response.json().catch(() => null);
          const msg =
            errBody && typeof errBody === "object"
              ? String(
                  (errBody as Record<string, unknown>).error ??
                    "Analysis failed",
                )
              : "Analysis failed";
          throw new Error(msg);
        }

        const body = response.body;
        if (!body) throw new Error("No response stream available");

        const reader = body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let completed = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const lines = part.split("\n");
            let eventType = "";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataStr = line.slice(6);
              }
            }

            if (!eventType || !dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              switch (eventType) {
                case "agent_start": {
                  const agentId = data.agent as string;
                  setCurrentAgent(agentId);
                  setAgents((prev) =>
                    prev.map((a) =>
                      a.id === agentId ? { ...a, status: "running" as const } : a,
                    ),
                  );
                  break;
                }

                case "agent_done": {
                  const agentId = data.agent as string;
                  completed++;
                  setProgress(completed / AGENTS.length);
                  setAgents((prev) =>
                    prev.map((a) =>
                      a.id === agentId
                        ? {
                            ...a,
                            status: "done" as const,
                            output:
                              typeof data.output === "object"
                                ? JSON.stringify(data.output, null, 2)
                                : String(data.output ?? ""),
                            duration: (data.duration as number) ?? 0,
                          }
                        : a,
                    ),
                  );
                  break;
                }

                case "complete": {
                  const analysis = data as MeetingAnalysis;
                  setResults(analysis);
                  break;
                }

                case "error": {
                  throw new Error(
                    (data.message as string) ?? "Agent pipeline error",
                  );
                }
              }
            } catch {
              /* skip malformed event */
            }
          }
        }

        setProgress(1);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
        setAgents((prev) =>
          prev.map((a) =>
            a.status === "running" ? { ...a, status: "error" as const } : a,
          ),
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [reset],
  );

  return { agents, currentAgent, results, isLoading, error, progress, analyze, reset };
}
