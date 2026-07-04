"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Sparkles, FileText, AlertTriangle, CheckCircle, Clock, User, Target, CheckSquare, Mail, Zap, Brain, Activity } from "lucide-react";
import Link from "next/link";
import type { MeetingAnalysis, Agent } from "@/lib/types";

const SAMPLE_TRANSCRIPT = `Meeting: Q3 Product Roadmap Planning
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
Sarah: Excellent. Let's also talk about the budget. We have $50k remaining for Q3.
Mike: The analytics dashboard will cost about $30k in engineering time.
Lisa: Design resources will be around $5k for user research and prototyping.
James: Marketing can allocate $10k for the launch campaign.
Sarah: That leaves us $5k buffer. Good. One more thing — the executive team wants a decision on the new collaboration feature.
Mike: That would require at least 2 more engineers. We don't have the headcount.
Sarah: Let's push that to Q4 planning then. Mike, include that in your roadmap proposal.
Mike: Will do. I'll also include the performance optimization work.
James: Should I mention the mobile improvements in the customer newsletter?
Sarah: Yes, but frame it as "coming soon" rather than promising dates.
Lisa: I can create some mockups for the newsletter visuals.
James: That would be great, Lisa. Let's sync on Thursday after your design review.
Sarah: Okay, I think we have a solid plan. Let me summarize the action items:
1. Mike — Detailed engineering plan for analytics dashboard by Monday
2. Lisa — Design explorations for analytics dashboard by Thursday
3. James — Customer communication draft about improvements by Friday
4. Mike — Include performance optimization in roadmap
5. Mike — Add collaboration feature to Q4 proposal
6. Lisa — Create newsletter visuals for James
7. Sarah — Schedule follow-up meeting for Monday
Any questions? No? Great work everyone.`;

const agentSteps = [
  { id: "transcript-processor", label: "Processing Transcript", icon: FileText, color: "#6366f1" },
  { id: "action-item-extractor", label: "Extracting Action Items", icon: CheckSquare, color: "#10b981" },
  { id: "sentiment-analyzer", label: "Analyzing Sentiment", icon: Activity, color: "#f59e0b" },
  { id: "summary-writer", label: "Writing Summary", icon: FileText, color: "#8b5cf6" },
  { id: "followup-email", label: "Generating Email", icon: Mail, color: "#06b6d4" },
];

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function StatusBadge({ status }: { status: Agent["status"] }) {
  const map: Record<Agent["status"], { label: string; color: string }> = {
    idle: { label: "Pending", color: "bg-gray-700 text-gray-400" },
    running: { label: "Running", color: "bg-indigo-500/20 text-indigo-300" },
    done: { label: "Done", color: "bg-emerald-500/20 text-emerald-300" },
    error: { label: "Error", color: "bg-red-500/20 text-red-300" },
  };
  const s = map[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", s.color)}>{s.label}</span>;
}

function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-8 w-8 border-[3px]" : "h-5 w-5 border-2";
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={cn("rounded-full border-current border-r-transparent text-primary", s)}
    />
  );
}

export default function AnalyzePage() {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeetingAnalysis | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, Agent["status"]>>({});
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [crash, setCrash] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCrash(null);
    setAgentStatuses({
      "transcript-processor": "running",
      "action-item-extractor": "idle",
      "sentiment-analyzer": "idle",
      "summary-writer": "idle",
      "followup-email": "idle",
    });
    setCurrentAgent("transcript-processor");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim(), title: "Meeting Analysis", depth: "standard" }),
      });

      const json = await res.json().catch(() => null) as Record<string, unknown>;
      if (!json || json.success === false) {
        throw new Error((json?.error as string) || `HTTP ${res.status}`);
      }

      const data = json.data as MeetingAnalysis;
      if (!mountedRef.current) return;
      setResult(data);
      setAgentStatuses({
        "transcript-processor": "done",
        "action-item-extractor": "done",
        "sentiment-analyzer": "done",
        "summary-writer": "done",
        "followup-email": "done",
      });
      setCurrentAgent(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[AnalyzePage]", msg);
      if (mountedRef.current) {
        setError(msg);
        setAgentStatuses((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            if (next[key] === "running") next[key] = "error";
          }
          return next;
        });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [transcript, loading]);

  if (crash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-error" />
          <h2 className="mb-2 text-xl font-bold text-text-primary">Something went wrong</h2>
          <p className="mb-6 text-sm text-text-muted">{crash}</p>
          <Link href="/analyze" className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  try {
    return (
      <AnalyzeInner
        transcript={transcript}
        setTranscript={setTranscript}
        loading={loading}
        error={error}
        result={result}
        agentStatuses={agentStatuses}
        currentAgent={currentAgent}
        handleAnalyze={handleAnalyze}
        setCrash={setCrash}
        onRetry={() => setError(null)}
        onNew={() => { setResult(null); setTranscript(""); }}
      />
    );
  } catch (e) {
    setCrash(e instanceof Error ? e.message : "Page crashed");
    return null;
  }
}

function AnalyzeInner({
  transcript, setTranscript, loading, error, result, agentStatuses, currentAgent, handleAnalyze, setCrash, onRetry, onNew,
}: {
  transcript: string; setTranscript: (v: string) => void; loading: boolean; error: string | null; result: MeetingAnalysis | null; agentStatuses: Record<string, Agent["status"]>; currentAgent: string | null; handleAnalyze: () => void; setCrash: (v: string) => void; onRetry: () => void; onNew: () => void;
}) {
  const runningCount = Object.values(agentStatuses).filter((s) => s === "running" || s === "done").length;
  const doneCount = Object.values(agentStatuses).filter((s) => s === "done").length;

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-lg font-bold text-transparent">MeetMind</span>
          </Link>
          <Link href="/" className="text-sm text-text-muted hover:text-text-primary transition-colors">Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        {/* ---- INPUT PHASE ---- */}
        {!loading && !result && !error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
              >
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent bg-[length:200%_auto] animate-pulse" style={{ animationDuration: "3s" }}>
                  Analyze Your Meeting
                </span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 text-text-muted sm:text-lg">
                5 AI agents extract summaries, action items, decisions & more.
              </motion.p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <textarea
                value={transcript}
                onChange={(e) => { setTranscript(e.target.value); setCrash(""); }}
                placeholder="Paste your meeting transcript here..."
                rows={12}
                className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm text-text-primary placeholder:text-text-dim outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface2 px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    Load Sample
                  </button>
                  <span className="text-xs text-text-dim">{transcript.length.toLocaleString()} chars</span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={transcript.trim().split(/\s+/).length < 50 || loading}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                  <Zap className="h-4 w-4" />
                  Analyze Meeting
                </button>
              </div>
              {transcript.trim().split(/\s+/).length < 50 && transcript.trim().length > 0 && (
                <p className="mt-2 text-xs text-warning">Minimum 50 words required ({transcript.trim().split(/\s+/).length} words)</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ---- LOADING PHASE ---- */}
        {loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
            <div className="mb-8 text-center">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Bot className="h-7 w-7 text-primary" />
              </motion.div>
              <h2 className="text-xl font-bold text-text-primary sm:text-2xl">Analyzing Your Meeting</h2>
              <p className="mt-1 text-sm text-text-muted">5 AI agents processing your transcript — {doneCount}/5 done</p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Progress</span>
                  <span className="text-sm text-text-muted">{Math.round((doneCount / 5) * 100)}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-surface2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(doneCount / 5) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {agentSteps.map((step, i) => {
                  const status = agentStatuses[step.id] || "idle";
                  const isRunning = status === "running";
                  const isDone = status === "done";
                  const isError = status === "error";
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "flex items-center gap-4 rounded-xl border p-4 transition-all duration-300",
                        isRunning ? "border-primary/30 bg-primary/5" : isDone ? "border-success/20 bg-success/5" : isError ? "border-error/20 bg-error/5" : "border-border bg-surface2/50",
                      )}
                      style={isRunning ? { boxShadow: `0 0 20px ${step.color}15` } : undefined}
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300",
                        isDone ? "bg-success/20" : isRunning ? "bg-primary/20" : isError ? "bg-error/20" : "bg-surface2",
                      )}>
                        {isDone ? <CheckCircle className="h-4 w-4 text-success" /> : isError ? <AlertTriangle className="h-4 w-4 text-error" /> : isRunning ? <LoadingSpinner size="sm" /> : <step.icon className="h-4 w-4 text-text-dim" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          isDone ? "text-success" : isRunning ? "text-text-primary" : isError ? "text-error" : "text-text-muted",
                        )}>{step.label}</p>
                      </div>
                      <StatusBadge status={status} />
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-dim">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Processing
              </div>
              <span>&middot;</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-success" />
                {doneCount} done
              </div>
              <span>&middot;</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {5 - doneCount} pending
              </div>
            </div>
          </motion.div>
        )}

        {/* ---- ERROR PHASE ---- */}
        {error && !loading && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/15">
              <AlertTriangle className="h-8 w-8 text-error" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-text-primary">Analysis Failed</h2>
            <p className="mb-6 text-sm text-text-muted">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={onRetry} className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
                <ArrowRight className="h-4 w-4" /> Try Again
              </button>
              <Link href="/" className="text-sm text-text-muted hover:text-text-primary transition-colors">Back Home</Link>
            </div>
          </motion.div>
        )}

        {/* ---- RESULTS PHASE ---- */}
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <CheckCircle className="h-6 w-6 text-success" />
              </motion.div>
              <h2 className="text-xl font-bold text-text-primary sm:text-2xl">Analysis Complete</h2>
              <p className="text-sm text-text-muted">All 5 agents finished processing</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button onClick={onNew} className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
                  <ArrowRight className="h-4 w-4" /> New Analysis
                </button>
                <Link href="/" className="text-sm text-text-muted hover:text-text-primary transition-colors">Home</Link>
              </div>
            </div>

            {/* Summary Card */}
            <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Summary</h3>
                  <p className="text-xs text-text-muted">Sentiment: {result.sentiment}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-text-muted whitespace-pre-line">{result.summary}</p>
              {result.decisions.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <Target className="h-4 w-4 text-primary" />
                    Key Decisions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.decisions.map((d, i) => (
                      <span key={i} className="rounded-lg border border-border bg-surface2 px-3 py-1.5 text-xs text-text-muted">{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Items Card */}
            <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-success to-emerald-400">
                  <CheckSquare className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Action Items ({result.actionItems.length})</h3>
              </div>
              {result.actionItems.length === 0 ? (
                <p className="text-sm text-text-dim">No action items identified.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {result.actionItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 rounded-xl border border-border bg-surface2 p-4">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <CheckSquare className={cn("h-3.5 w-3.5", item.priority === "high" ? "text-error" : item.priority === "medium" ? "text-warning" : "text-success")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{item.task}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.owner}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.deadline}</span>
                          <span className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            item.priority === "high" ? "bg-error/10 text-error" : item.priority === "medium" ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
                          )}>{item.priority}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Follow-up Email Card */}
            {result.followUpEmail && (
              <div className="mb-6 rounded-2xl border border-border bg-surface p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-cyan-400">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">Follow-up Email</h3>
                </div>
                <div className="rounded-xl bg-background p-4">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted font-sans">{result.followUpEmail}</pre>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {!loading && (
        <footer className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-text-dim">
            &copy; {new Date().getFullYear()} MeetMind. AI-powered meeting intelligence.
          </div>
        </footer>
      )}
    </div>
  );
}
