"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Zap,
  Sparkles,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Depth = "quick" | "standard" | "deep";

interface TranscriptInputProps {
  onAnalyze?: (transcript: string, title: string, depth: Depth) => void;
  loading?: boolean;
}

const sampleTranscript = `Meeting: Q3 Product Roadmap Planning
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

const depths: { id: Depth; label: string; time: string; desc: string; icon: typeof Zap }[] = [
  {
    id: "quick",
    label: "Quick",
    time: "~30 sec",
    desc: "Basic summary & action items",
    icon: Zap,
  },
  {
    id: "standard",
    label: "Standard",
    time: "~1 min",
    desc: "Full analysis with sentiment & tasks",
    icon: Sparkles,
  },
  {
    id: "deep",
    label: "Deep",
    time: "~2 min",
    desc: "Deep analysis with all agents",
    icon: ChevronDown,
  },
];

export default function TranscriptInput({
  onAnalyze,
  loading = false,
}: TranscriptInputProps) {
  const [transcript, setTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const [dragOver, setDragOver] = useState(false);
  const [showDepth, setShowDepth] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "0";
      el.style.height = `${Math.max(200, el.scrollHeight)}px`;
    }
  }, []);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt" || ext === "pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setTranscript((prev) => prev + (prev ? "\n" : "") + text);
          setTimeout(autoResize, 0);
        }
      };
      reader.readAsText(file);
    }
  }, [autoResize]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleAnalyze = () => {
    if (!transcript.trim() || loading) return;
    onAnalyze?.(transcript, title, depth);
  };

  const loadSample = () => {
    setTranscript(sampleTranscript);
    if (!title) setTitle("Q3 Product Roadmap Planning");
    setTimeout(autoResize, 0);
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        <div>
          <label
            htmlFor="meeting-title"
            className="mb-1.5 block text-sm font-medium text-text-primary"
          >
            Meeting Title <span className="text-text-muted">(optional)</span>
          </label>
          <input
            id="meeting-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Q3 Product Roadmap Planning"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Transcript
          </label>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200",
              dragOver
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-primary/30",
            )}
          >
            <textarea
              ref={textareaRef}
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                autoResize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  handleAnalyze();
                }
              }}
              placeholder="Paste your meeting transcript here... (Ctrl+Enter to analyze)"
              className="min-h-[200px] w-full resize-none bg-transparent px-4 py-3.5 text-sm text-text-primary placeholder:text-text-dim outline-none"
              rows={8}
            />

            <div className="flex items-center justify-between border-t border-border bg-surface2/50 px-4 py-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload .txt / .pdf
              </button>
              <span className="text-xs text-text-dim">
                {transcript.length.toLocaleString()} chars
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
              className="hidden"
            />

            <AnimatePresence>
              {dragOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-primary" />
                    <p className="text-sm font-medium text-primary">
                      Drop your file here
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="relative">
          <button
            onClick={loadSample}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface p-3 text-sm text-text-muted hover:text-text-primary hover:border-primary/30 transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4" />
            Load sample transcript
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDepth(!showDepth)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary transition-colors hover:border-primary/30 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {(() => {
                const active = depths.find((d) => d.id === depth);
                const Icon = active?.icon ?? Zap;
                return (
                  <>
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{active?.label ?? "Standard"}</span>
                    <span className="text-text-muted">— {active?.desc}</span>
                  </>
                );
              })()}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-text-muted transition-transform duration-200",
                showDepth && "rotate-180",
              )}
            />
          </button>

          <AnimatePresence>
            {showDepth && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
              >
                {depths.map((d) => {
                  const Icon = d.icon;
                  const isActive = depth === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDepth(d.id);
                        setShowDepth(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted hover:bg-surface2 hover:text-text-primary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{d.label}</span>
                        <span className="ml-2 text-xs text-text-dim">
                          {d.time}
                        </span>
                        <p className="text-xs text-text-dim mt-0.5">
                          {d.desc}
                        </p>
                      </div>
                      {isActive && (
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          size="lg"
          onClick={handleAnalyze}
          loading={loading}
          disabled={!transcript.trim()}
          className="w-full gap-2 shadow-lg shadow-primary/20"
        >
          {loading ? "Analyzing..." : "Analyze Meeting"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
