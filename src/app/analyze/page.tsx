"use client";

import { useState, useRef, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Brain,
  ArrowLeft,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Printer,
  Share2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import AgentProgress from "@/components/agent/AgentProgress";
import TranscriptInput from "@/components/sections/TranscriptInput";
import { useAnalysis } from "@/lib/hooks/useAnalysis";
import { useToast, ToastContainer } from "@/components/ui/Toast";

const ResultsPanel = lazy(() => import("@/components/agent/ResultsPanel"));

type Phase = "input" | "processing" | "results" | "error";

function ResultsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded bg-surface2" />
      <div className="h-4 w-72 rounded bg-surface2" />
      <div className="mt-6 h-40 rounded-xl bg-surface2" />
      <div className="h-32 rounded-xl bg-surface2" />
      <div className="h-32 rounded-xl bg-surface2" />
    </div>
  );
}

export default function AnalyzePage() {
  const { agents, currentAgent, results, isLoading, error, progress, analyze, reset } =
    useAnalysis();
  const { toasts, addToast, dismiss } = useToast();
  const [phase, setPhase] = useState<Phase>("input");
  const [copiedShare, setCopiedShare] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async (
    transcript: string,
    title: string,
    depth: "quick" | "standard" | "deep",
  ) => {
    setPhase("processing");
    setTimeout(() => {
      progressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    try {
      await analyze(transcript, title, depth);
      setPhase("results");
      addToast("Analysis complete! All 5 agents finished.", "success");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981"],
      });
    } catch {
      setPhase("error");
    }
  };

  const handleRetry = () => {
    reset();
    setPhase("input");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(
        `Check out my meeting analysis on MeetMind: ${url}`,
      );
      setCopiedShare(true);
      addToast("Share link copied to clipboard!", "success");
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      addToast("Could not copy share link", "error");
    }
  };

  const percent = Math.round(progress * 100);

  return (
    <ErrorBoundary>
      <div className="min-h-full flex flex-col">
        <ToastContainer toasts={toasts} onDismiss={dismiss} />

        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl no-print">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                  <Brain className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-base font-bold text-transparent">
                  MeetMind
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {phase === "results" && (
                <>
                  <button
                    onClick={handlePrint}
                    className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                    title="Download as PDF"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
                    title="Share results"
                  >
                    {copiedShare ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">Share</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRetry}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                  <Link href="/">
                    <Button variant="secondary" size="sm" className="gap-1.5">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Home</span>
                    </Button>
                  </Link>
                </>
              )}
              {phase !== "results" && (
                <span className="text-xs text-text-muted hidden sm:block">
                  AI Meeting Intelligence
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            {phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20"
              >
                <div className="mb-8 text-center">
                  <h1 className="text-2xl font-bold text-text-primary sm:text-4xl">
                    Analyze Your Meeting
                  </h1>
                  <p className="mt-2 text-sm text-text-muted sm:text-base">
                    Paste a transcript and let 5 AI agents extract everything
                    important.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
                  <TranscriptInput
                    onAnalyze={handleAnalyze}
                    loading={isLoading}
                  />
                </div>
              </motion.div>
            )}

            {phase === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"
                ref={progressRef}
              >
                <div className="mb-6 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15"
                  >
                    <Brain className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h2 className="text-lg font-bold text-text-primary sm:text-xl">
                    Analyzing Your Meeting
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    5 AI agents processing your transcript
                    {percent > 0 && (
                      <span className="ml-1 text-primary">
                        &mdash; {percent}% complete
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
                  <AgentProgress
                    agents={agents}
                    currentAgent={currentAgent ?? ""}
                  />
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-text-dim">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Processing
                  </div>
                  <span>&middot;</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    {agents.filter((a) => a.status === "done").length} done
                  </div>
                  <span>&middot;</span>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-text-dim" />
                    {agents.filter((a) => a.status === "idle").length} pending
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "results" && results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
              >
                <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary sm:text-xl">
                      Analysis Results
                    </h2>
                    <p className="text-sm text-text-muted">
                      All 5 agents completed their analysis
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
                  <Suspense fallback={<ResultsSkeleton />}>
                    <ResultsPanel analysis={results} />
                  </Suspense>
                </div>
              </motion.div>
            )}

            {phase === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mx-auto max-w-lg px-4 py-20 text-center"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-error/15">
                  <AlertTriangle className="h-8 w-8 text-error" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-text-primary">
                  Analysis Failed
                </h2>
                <p className="mb-2 text-sm text-text-muted">
                  {error || "Something went wrong during analysis."}
                </p>
                <p className="mb-8 text-xs text-text-dim">
                  Check your API key configuration and try again.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={handleRetry} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Try Again
                  </Button>
                  <Link href="/">
                    <Button variant="ghost">Back Home</Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {phase !== "processing" && (
          <footer className="no-print border-t border-border bg-surface">
            <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-text-dim">
              &copy; {new Date().getFullYear()} MeetMind. AI-powered meeting
              intelligence.
            </div>
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
}
