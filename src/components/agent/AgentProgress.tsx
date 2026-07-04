"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  CheckSquare,
  Activity,
  Send,
  Brain,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";
import { AGENTS } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  FileText,
  CheckSquare,
  Activity,
  Send,
};

interface AgentProgressProps {
  agents: Agent[];
  currentAgent: string;
}

export default function AgentProgress({
  agents,
  currentAgent,
}: AgentProgressProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedDefinitions = [...AGENTS];

  const completed = agents.filter((a) => a.status === "done").length;
  const total = agents.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">
            Analysis Progress
          </span>
          <span className="text-sm text-text-muted">
            {completed} / {total} agents complete
          </span>
        </div>
        <div className="relative h-2 overflow-hidden rounded-full bg-surface2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
          />
        </div>
        <span className="mt-1 block text-right text-xs text-text-dim">
          {percent}%
        </span>
      </div>

      <div className="relative">
        <svg
          className="absolute left-[19px] top-0 hidden h-full w-6 md:block"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {sortedDefinitions.map((def) => {
            if (def === sortedDefinitions[sortedDefinitions.length - 1]) return null;
            const agent = agents.find((a) => a.id === def.id);
            const isDone = agent?.status === "done";
            return (
              <line
                key={def.id}
                x1="12"
                y1={sortedDefinitions.indexOf(def) * 88 + 40}
                x2="12"
                y2={(sortedDefinitions.indexOf(def) + 1) * 88 + 40}
                stroke={isDone ? def.color : "#161822"}
                strokeWidth="2"
                strokeDasharray={isDone ? "none" : "4 3"}
                className="transition-colors duration-500"
              />
            );
          })}
        </svg>

        <div className="flex flex-col gap-1 md:flex-row md:items-start md:gap-0">
          {sortedDefinitions.map((def) => {
            const agent =
              agents.find((a) => a.id === def.id) ?? ({
                id: def.id,
                name: def.name,
                role: def.role,
                status: "idle",
              } as Agent);

            const Icon = iconMap[def.icon] ?? Brain;
            const isActive = agent.id === currentAgent;
            const isDone = agent.status === "done";
            const isRunning = agent.status === "running";
            const isError = agent.status === "error";
            const isExpanded = expandedId === agent.id;

            return (
              <div key={def.id} className="relative flex-1 md:px-1">
                <div className="flex items-start gap-3 md:flex-col md:items-center">
                  <motion.button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : agent.id)
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 flex-shrink-0 cursor-pointer"
                  >
                    <motion.div
                      animate={
                        isRunning
                          ? { rotate: 360 }
                          : { rotate: 0 }
                      }
                      transition={
                        isRunning
                          ? { duration: 2, repeat: Infinity, ease: "linear" }
                          : { duration: 0.3 }
                      }
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl border-2 transition-all duration-300",
                        isDone && "border-success bg-success/15",
                        isRunning && "border-primary bg-primary/15",
                        isError && "border-error bg-error/15",
                        !isDone && !isRunning && !isError && "border-border bg-surface",
                      )}
                      style={{
                        borderColor: isRunning || (!isDone && !isError) ? `${def.color}50` : undefined,
                        backgroundColor: `${def.color}10`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{
                          color: isDone ? "#10b981" : isError ? "#ef4444" : def.color,
                        }}
                      />
                    </motion.div>

                    {(isRunning || isActive) && (
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -inset-2 rounded-xl opacity-20"
                        style={{ backgroundColor: def.color }}
                      />
                    )}

                    {isDone && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-success">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {isError && (
                      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error">
                        <span className="text-[10px] font-bold text-white">!</span>
                      </div>
                    )}
                  </motion.button>

                  <div className="flex-1 min-w-0 md:text-center md:mt-2">
                    <p
                      className={cn(
                        "text-xs font-medium transition-colors duration-300",
                        isDone && "text-success",
                        isRunning && "text-primary",
                        isError && "text-error",
                        !isDone && !isRunning && !isError && "text-text-muted",
                      )}
                    >
                      {def.name}
                    </p>
                    <p className="text-[10px] text-text-dim mt-0.5 leading-tight">
                      {def.role}
                    </p>
                    {agent.status !== "idle" && (
                      <span className="text-[10px] text-text-dim">
                        {agent.duration !== undefined
                          ? `${(agent.duration / 1000).toFixed(1)}s`
                          : agent.status === "running"
                            ? "processing..."
                            : ""}
                      </span>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && agent.output && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden md:mt-2 md:text-center"
                    >
                      <div className="mt-2 rounded-lg bg-surface2 p-3 md:mt-1">
                        <p className="text-xs leading-relaxed text-text-muted whitespace-pre-wrap">
                          {agent.output}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isExpanded && !isDone && !isRunning && agent.status !== "error" && (
                  <div className="mt-2 md:text-center">
                    <span className="text-[10px] text-text-dim">idle</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
