"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Bot, Sparkles, FileText, AlertTriangle, CheckCircle,
  Clock, User, Target, CheckSquare, Mail, Zap, Brain, Activity,
  Copy, Check, ExternalLink, ListTodo, X, Calendar,
} from "lucide-react";
import Link from "next/link";
import type { MeetingAnalysis, Agent } from "@/lib/types";

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(" ");

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

type Depth = "quick" | "standard" | "deep";
type TabId = "summary" | "action-items" | "email" | "tasks";

const PIPELINE_COLORS = [
  { primary: "#7C3AED", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.25)", glow: "rgba(124,58,237,0.15)" },
  { primary: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", glow: "rgba(16,185,129,0.15)" },
  { primary: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.15)" },
  { primary: "#EC4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.25)", glow: "rgba(236,72,153,0.15)" },
  { primary: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", glow: "rgba(6,182,212,0.15)" },
];

const agentSteps = [
  { id: "transcript-processor" as const, label: "Processing Transcript", desc: "Cleaning & structuring transcript...", icon: FileText, color: PIPELINE_COLORS[0].primary, palette: PIPELINE_COLORS[0] },
  { id: "action-item-extractor" as const, label: "Extracting Action Items", desc: "Finding tasks & owners...", icon: CheckSquare, color: PIPELINE_COLORS[1].primary, palette: PIPELINE_COLORS[1] },
  { id: "sentiment-analyzer" as const, label: "Analyzing Sentiment", desc: "Detecting tone & emotions...", icon: Activity, color: PIPELINE_COLORS[2].primary, palette: PIPELINE_COLORS[2] },
  { id: "summary-writer" as const, label: "Writing Summary", desc: "Generating key insights...", icon: FileText, color: PIPELINE_COLORS[3].primary, palette: PIPELINE_COLORS[3] },
  { id: "followup-email" as const, label: "Generating Email", desc: "Drafting follow-up...", icon: Mail, color: PIPELINE_COLORS[4].primary, palette: PIPELINE_COLORS[4] },
];

const AGENT_IDS = agentSteps.map((a) => a.id);

const tabConfig: { id: TabId; label: string; icon: typeof Sparkles }[] = [
  { id: "summary", label: "Summary", icon: Sparkles },
  { id: "action-items", label: "Action Items", icon: CheckSquare },
  { id: "email", label: "Email", icon: Mail },
  { id: "tasks", label: "Tasks", icon: ListTodo },
];

const depthOptions: { id: Depth; label: string; desc: string }[] = [
  { id: "quick", label: "Quick", desc: "~30s" },
  { id: "standard", label: "Standard", desc: "~1min" },
  { id: "deep", label: "Deep", desc: "~2min" },
];

function StatusBadge({ status, color }: { status: Agent["status"]; color: string }) {
  const map: Record<Agent["status"], { label: string; cls: string }> = {
    idle: { label: "Pending", cls: "bg-zinc-800/50 text-zinc-500" },
    running: { label: "Running", cls: "" },
    done: { label: "Done", cls: "text-emerald-300" },
    error: { label: "Error", cls: "bg-red-500/20 text-red-300" },
  };
  const s = map[status];
  if (status === "running") {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
        style={{ backgroundColor: `${color}20`, color }}>
        Running
      </span>
    );
  }
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium", s.cls)}>{s.label}</span>;
}

function LoadingSpinner({ color = "text-primary", size = "md" }: { color?: string; size?: string }) {
  const s = size === "sm" ? "h-4 w-4 border-2" : "h-5 w-5 border-2";
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className={cn("rounded-full border-current border-r-transparent", s, color)}
    />
  );
}

let tid = 0;
function useToast() {
  const [items, set] = useState<{ id: number; msg: string; ok: boolean }[]>([]);
  const add = useCallback((msg: string, ok = true) => {
    const id = ++tid;
    set((p) => [...p, { id, msg, ok }]);
    setTimeout(() => set((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  const dismiss = useCallback((id: number) => set((p) => p.filter((t) => t.id !== id)), []);
  return { items, add, dismiss };
}

function ToastBar({ items, dismiss }: { items: { id: number; msg: string; ok: boolean }[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm text-sm",
              t.ok ? "border-primary/20 bg-primary/10" : "border-red-500/20 bg-red-500/10",
            )}
          >
            {t.ok
              ? <CheckCircle className="h-4 w-4 text-primary" />
              : <AlertTriangle className="h-4 w-4 text-error" />}
            {t.msg}
            <button onClick={() => dismiss(t.id)} className="ml-2 cursor-pointer text-text-muted hover:text-text-primary transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function PipelineSvg({ agentStatuses }: { agentStatuses: Record<string, Agent["status"]> }) {
  return (
    <svg className="pointer-events-none absolute left-[23px] top-0 hidden h-full w-6 md:block"
      style={{ height: `${agentSteps.length * 88 - 16}px`, marginTop: 0 }} aria-hidden="true">
      {agentSteps.slice(0, -1).map((step, i) => {
        const segDone = agentStatuses[step.id] === "done";
        return (
          <line
            key={step.id}
            x1="12" y1={52 + i * 88}
            x2="12" y2={52 + (i + 1) * 88 - 16}
            stroke={segDone ? step.color : "#1e293b"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={segDone ? "none" : "5 4"}
            className="transition-all duration-700"
          />
        );
      })}
    </svg>
  );
}

function AgentCard({ step, status, index }: { step: typeof agentSteps[number]; status: Agent["status"]; index: number }) {
  const isRunning = status === "running";
  const isDone = status === "done";
  const isError = status === "error";
  const { palette, icon: Icon } = step;

  return (
    <motion.div
      initial={{ opacity: 0, x: -24, scale: 0.95 }}
      animate={{
        opacity: 1, x: 0, scale: 1,
        transition: { delay: index * 0.1, duration: 0.4, ease: "easeOut" },
      }}
      className={cn(
        "relative flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-500",
        isRunning && "bg-surface2",
        isError && "border-red-500/30 bg-red-500/5",
        !isDone && !isRunning && !isError && "border-border bg-surface2/30",
      )}
      style={
        isDone ? {
          borderColor: `${palette.primary}40`,
          backgroundColor: palette.bg,
          boxShadow: `0 0 25px ${palette.glow}`,
        } : isRunning ? {
          borderColor: palette.border,
          boxShadow: `0 0 30px ${palette.glow}, inset 0 0 30px ${palette.bg}`,
        } : undefined
      }
    >
      {isRunning && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.5, 0.8], opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: `2px solid ${palette.border}` }}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-500",
          isRunning && "animate-pulse-ring",
          isError && "bg-red-500/20",
          !isDone && !isRunning && !isError && "bg-surface2",
        )}
        style={
          isDone
            ? { backgroundColor: palette.bg }
            : isRunning
              ? { backgroundColor: palette.bg, "--ring-color": `${palette.primary}40` } as React.CSSProperties
              : undefined
        }
      >
        {isDone ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <CheckCircle className="h-6 w-6" style={{ color: palette.primary }} />
          </motion.div>
        ) : isError ? (
          <AlertTriangle className="h-6 w-6 text-error" />
        ) : isRunning ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Icon className="h-5 w-5 text-zinc-500" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-semibold",
            isRunning && "text-text-primary",
            isError && "text-error",
            !isDone && !isRunning && !isError && "text-zinc-500",
          )}
            style={isDone ? { color: palette.primary } : undefined}
          >
            {step.label}
          </p>
          {isDone && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex h-5 w-5 items-center justify-center rounded-full"
              style={{ backgroundColor: `${palette.primary}20` }}
            >
              <Check className="h-3 w-3" style={{ color: palette.primary }} />
            </motion.span>
          )}
        </div>
        <p className={cn("text-xs mt-0.5", isRunning && "animate-pulse", isRunning ? "text-zinc-400" : "text-zinc-600")}
          style={isDone ? { color: `${palette.primary}99` } : undefined}>
          {isRunning ? step.desc : isDone ? "Completed" : isError ? "Failed" : "Waiting..."}
        </p>
      </div>

      {/* Status badge */}
      <StatusBadge status={status} color={palette.primary} />
    </motion.div>
  );
}

export default function AnalyzePage() {
  const [transcript, setTranscript] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeetingAnalysis | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, Agent["status"]>>({});
  const [pipelineIdx, setPipelineIdx] = useState(-1);
  const [crash, setCrash] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("summary");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiData, setApiData] = useState<MeetingAnalysis | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const toast = useToast();
  const mountedRef = useRef(true);
  const abortRef = useRef(false);
  const pipeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  // When all agents reach a terminal state (done/error) AND API has responded → show results or error
  useEffect(() => {
    if (!loading) return;
    const allTerminal = AGENT_IDS.every((id) => {
      const s = agentStatuses[id];
      return s === "done" || s === "error";
    });
    if (!allTerminal) return;
    if (!apiData && !apiError) return;

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      if (apiData) {
        setResult(apiData);
        setApiData(null);
        toast.add("Analysis complete! All 5 agents finished.");
      } else {
        setError(apiError);
        setApiError(null);
        toast.add(apiError || "Analysis failed", false);
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [loading, agentStatuses, apiData, apiError, toast]);

  const copyText = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.add("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch { toast.add("Failed to copy", false); }
  }, [toast]);

  const handleAnalyze = useCallback(async () => {
    if (!transcript.trim() || loading) return;
    abortRef.current = false;
    setApiData(null);
    setApiError(null);
    setLoading(true);
    setError(null);
    setResult(null);
    setCrash(null);
    setTab("summary");

    const initial: Record<string, Agent["status"]> = {};
    for (const id of AGENT_IDS) initial[id] = "idle";
    initial[AGENT_IDS[0]] = "running";
    setAgentStatuses(initial);
    setPipelineIdx(0);

    pipeIntervalRef.current = setInterval(() => {
      if (abortRef.current) {
        if (pipeIntervalRef.current) { clearInterval(pipeIntervalRef.current); pipeIntervalRef.current = null; }
        return;
      }
      setPipelineIdx((prev) => {
        const next = prev + 1;
        if (next >= AGENT_IDS.length) {
          if (pipeIntervalRef.current) { clearInterval(pipeIntervalRef.current); pipeIntervalRef.current = null; }
          const done: Record<string, Agent["status"]> = {};
          for (const id of AGENT_IDS) done[id] = "done";
          setAgentStatuses(done);
          return prev;
        }
        setAgentStatuses((s) => ({
          ...s,
          [AGENT_IDS[prev]]: "done",
          [AGENT_IDS[next]]: "running",
        }));
        return next;
      });
    }, 1800);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim(), title: meetingTitle || "Meeting Analysis", depth }),
      });

      let json: Record<string, unknown>;
      try {
        json = await res.json() as Record<string, unknown>;
      } catch {
        throw new Error(`Server returned ${res.status}: Invalid JSON response`);
      }

      if (!json || json.success === false) {
        throw new Error((json?.error as string) || `Server error (${res.status})`);
      }

      const data = json.data as MeetingAnalysis;
      if (!mountedRef.current) return;
      setApiData(data);
    } catch (err) {
      if (pipeIntervalRef.current) { clearInterval(pipeIntervalRef.current); pipeIntervalRef.current = null; }
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("[AnalyzePage]", msg);
      setApiError(msg);
      // Mark running→error, idle→done so the pipeline reaches a terminal state
      setAgentStatuses((prev) => {
        const n = { ...prev };
        for (const k of AGENT_IDS) {
          if (n[k] === "running") n[k] = "error";
          else if (n[k] === "idle") n[k] = "done";
        }
        return n;
      });
      setPipelineIdx(AGENT_IDS.length - 1);
    }
  }, [transcript, meetingTitle, depth, loading, toast]);

  if (crash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-error" />
          <h2 className="mb-2 text-xl font-bold text-text-primary">Something went wrong</h2>
          <p className="mb-6 text-sm text-text-muted">{crash}</p>
          <Link href="/analyze" className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">Try Again</Link>
        </div>
      </div>
    );
  }

  try {
    return (
      <>
        <ToastBar items={toast.items} dismiss={toast.dismiss} />
        <div className="min-h-full bg-background">
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-lg font-bold text-transparent">MeetMind</span>
              </Link>
              <div className="flex items-center gap-3">
                {(result && !loading) && (
                  <button onClick={() => { setResult(null); setTranscript(""); setMeetingTitle(""); }}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface2 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:border-primary/30 transition-all">
                    <ArrowRight className="h-3 w-3" /> New
                  </button>
                )}
                <Link href="/" className="text-sm text-text-muted hover:text-text-primary transition-colors">Home</Link>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
            {/* ====== INPUT PHASE ====== */}
            {!loading && !result && !error && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
                <div className="mb-8 text-center">
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                    <Brain className="h-8 w-8 text-primary" />
                  </motion.div>
                  <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                    <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-shift">Analyze Your Meeting</span>
                  </motion.h1>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 text-text-muted sm:text-lg">
                    5 colorful AI agents extract summaries, action items, decisions & more.
                  </motion.p>
                </div>

                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />
                  <div className="relative z-10">
                    <div className="mb-4">
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">Meeting Title <span className="text-text-muted">(optional)</span></label>
                      <input
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="Q3 Product Roadmap Planning"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                      />
                    </div>

                    <div className="mb-4">
                      <label className="mb-1.5 block text-sm font-medium text-text-primary">Transcript</label>
                      <div className="relative overflow-hidden rounded-xl border-2 border-border focus-within:border-primary/40 transition-all duration-200">
                        <textarea
                          value={transcript}
                          onChange={(e) => { setTranscript(e.target.value); setCrash(""); }}
                          placeholder="Paste your meeting transcript here..."
                          rows={12}
                          className="w-full resize-none bg-background p-4 text-sm text-text-primary placeholder:text-text-dim outline-none"
                        />
                        <div className="flex items-center justify-between border-t border-border bg-surface2/50 px-4 py-2">
                          <button onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors">
                            <FileText className="h-3.5 w-3.5" /> Load Sample
                          </button>
                          <span className="text-xs text-text-dim">{transcript.length.toLocaleString()} chars</span>
                        </div>
                      </div>
                      {transcript.trim().split(/\s+/).length < 50 && transcript.trim().length > 0 && (
                        <p className="mt-1.5 text-xs text-warning">Minimum 50 words required ({transcript.trim().split(/\s+/).length} words)</p>
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-text-primary">Analysis Depth</label>
                      <div className="flex gap-2">
                        {depthOptions.map((opt) => (
                          <button key={opt.id} onClick={() => setDepth(opt.id)}
                            className={cn(
                              "flex cursor-pointer flex-1 items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                              depth === opt.id
                                ? "border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                                : "border-border bg-surface text-text-muted hover:border-primary/30 hover:text-text-primary",
                            )}>
                            {opt.label}
                            <span className="text-[10px] opacity-60">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleAnalyze}
                      disabled={transcript.trim().split(/\s+/).length < 50 || loading}
                      className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary via-secondary to-accent px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <Zap className="h-4 w-4" /> Analyze Meeting <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== PIPELINE PHASE ====== */}
            {loading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl">
                <div className="mb-8 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"
                  >
                    <Bot className="h-8 w-8 text-primary" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-text-primary sm:text-2xl">Analyzing Your Meeting</h2>
                  <p className="mt-1 text-sm text-text-muted">
                    Agent {Math.min(pipelineIdx + 1, AGENT_IDS.length)} of {AGENT_IDS.length}
                    {pipelineIdx >= 0 && pipelineIdx < AGENT_IDS.length && ` — ${agentSteps[pipelineIdx].label}`}
                  </p>
                </div>

                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />
                  <div className="relative z-10">
                    {/* Progress bar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">Overall Progress</span>
                        <span className="text-sm text-text-muted">{Math.round(((pipelineIdx + 1) / AGENT_IDS.length) * 100)}%</span>
                      </div>
                      <div className="relative h-2.5 overflow-hidden rounded-full bg-surface2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((pipelineIdx + 1) / AGENT_IDS.length) * 100}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                        />
                        <motion.div
                          animate={{ x: ["0%", "100%"] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-y-0 w-8 rounded-full bg-white/15 blur-sm"
                        />
                      </div>
                    </div>

                    {/* Pipeline */}
                    <div className="relative flex flex-col gap-4">
                      <PipelineSvg agentStatuses={agentStatuses} />
                      {agentSteps.map((step, i) => {
                        const status = agentStatuses[step.id] || "idle";
                        return <AgentCard key={step.id} step={step} status={status} index={i} />;
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ====== ERROR PHASE ====== */}
            {error && !loading && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/15">
                  <AlertTriangle className="h-8 w-8 text-error" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-text-primary">Analysis Failed</h2>
                <p className="mb-6 text-sm text-text-muted">{error}</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setError(null)}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                    <ArrowRight className="h-4 w-4" /> Try Again
                  </button>
                  <Link href="/" className="text-sm text-text-muted hover:text-text-primary transition-colors">Back Home</Link>
                </div>
              </motion.div>
            )}

            {/* ====== RESULTS PHASE ====== */}
            {result && !loading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key="results">
                <div className="mb-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25"
                  >
                    <CheckCircle className="h-7 w-7 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-text-primary sm:text-2xl">Analysis Complete</h2>
                  <p className="text-sm text-text-muted">All 5 agents finished processing</p>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-1 rounded-xl border border-border bg-surface p-1">
                  {tabConfig.map((t) => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                      <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn(
                          "flex cursor-pointer flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                          active ? "bg-primary/10 text-primary shadow-sm" : "text-text-muted hover:text-text-primary",
                        )}>
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Summary */}
                {tab === "summary" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />
                    <div className="relative z-10">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-sm">
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
                            <Target className="h-4 w-4 text-primary" /> Key Decisions
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {result.decisions.map((d, i) => (
                              <span key={i} className="rounded-lg border border-border bg-surface2 px-3 py-1.5 text-xs text-text-muted">{d}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Action Items */}
                {tab === "action-items" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-400 shadow-sm">
                          <CheckSquare className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">Action Items ({result.actionItems.length})</h3>
                      </div>
                      {result.actionItems.length > 0 && (
                        <button onClick={() => copyText(result.actionItems.map((a) => `☐ ${a.task} — ${a.owner} [${a.priority}]`).join("\n"), "copy-actions")}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:border-primary/30 transition-all">
                          {copiedId === "copy-actions" ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                          Copy All
                        </button>
                      )}
                    </div>
                    {result.actionItems.length === 0 ? (
                      <p className="text-sm text-text-dim">No action items identified.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {result.actionItems.map((item) => (
                          <div key={item.id} className="flex items-start gap-4 rounded-xl border border-border bg-surface2 p-4 hover:border-primary/20 transition-all">
                            <div className={cn("flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full", item.priority === "high" ? "bg-red-500/10" : item.priority === "medium" ? "bg-amber-500/10" : "bg-emerald-500/10")}>
                              <CheckSquare className={cn("h-3.5 w-3.5", item.priority === "high" ? "text-error" : item.priority === "medium" ? "text-warning" : "text-success")} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary">{item.task}</p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                                <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.owner}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.deadline}</span>
                                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", item.priority === "high" ? "bg-red-500/10 text-error" : item.priority === "medium" ? "bg-amber-500/10 text-warning" : "bg-emerald-500/10 text-success")}>{item.priority}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Email */}
                {tab === "email" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-400 shadow-sm">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">Follow-up Email</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => copyText(result.followUpEmail, "copy-email")}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:border-primary/30 transition-all">
                          {copiedId === "copy-email" ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                          Copy
                        </button>
                        <a href={`mailto:?subject=${encodeURIComponent("Meeting Summary")}&body=${encodeURIComponent(result.followUpEmail)}`}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-all shadow-sm">
                          <ExternalLink className="h-3.5 w-3.5" /> Open in Gmail
                        </a>
                      </div>
                    </div>
                    <div className="rounded-xl bg-background p-4">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted font-sans">{result.followUpEmail}</pre>
                    </div>
                  </motion.div>
                )}

                {/* Tasks */}
                {tab === "tasks" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-400 shadow-sm">
                        <ListTodo className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-text-primary">Tasks ({result.tasks.length})</h3>
                    </div>
                    {result.tasks.length === 0 ? (
                      <p className="text-sm text-text-dim">No tasks generated.</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-3">
                        {["todo", "in-progress", "done"].map((status) => {
                          const tasks = result.tasks.filter((t) => t.status === status);
                          const color = status === "todo" ? "border-primary/20" : status === "in-progress" ? "border-accent/20" : "border-emerald-500/20";
                          const label = status === "todo" ? "To Do" : status === "in-progress" ? "In Progress" : "Done";
                          return (
                            <div key={status} className={cn("rounded-xl border p-4", color)}>
                              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", status === "todo" ? "bg-primary" : status === "in-progress" ? "bg-accent" : "bg-success")} />
                                {label} ({tasks.length})
                              </h4>
                              <div className="flex flex-col gap-2">
                                {tasks.length === 0 && <p className="text-xs text-text-dim">No tasks</p>}
                                {tasks.map((task) => (
                                  <div key={task.id} className="rounded-lg border border-border bg-surface2 p-3 hover:border-primary/20 transition-all">
                                    <p className="text-xs font-medium text-text-primary">{task.title}</p>
                                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-muted">
                                      <span className="flex items-center gap-1"><User className="h-2.5 w-2.5" />{task.assignee}</span>
                                      <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{task.dueDate}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
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
      </>
    );
  } catch (e) {
    setCrash(e instanceof Error ? e.message : "Page crashed");
    return null;
  }
}
