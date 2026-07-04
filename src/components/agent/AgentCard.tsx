"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  CheckSquare,
  Activity,
  Send,
  Brain,
  Check,
  X,
  Loader2,
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

const agentColorMap: Record<string, string> = {};
for (const a of AGENTS) {
  agentColorMap[a.id] = a.color;
}

interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
}

const statusConfig = {
  idle: {
    border: "border-border",
    glow: "",
    iconColor: "text-text-dim",
    label: "Waiting",
  },
  running: {
    border: "border-primary/40",
    glow: "shadow-lg shadow-primary/10",
    iconColor: "text-primary",
    label: "Analyzing",
  },
  done: {
    border: "border-success/40",
    glow: "shadow-lg shadow-success/10",
    iconColor: "text-success",
    label: "Complete",
  },
  error: {
    border: "border-error/40",
    glow: "shadow-lg shadow-error/10",
    iconColor: "text-error",
    label: "Failed",
  },
};

export default function AgentCard({ agent, isActive }: AgentCardProps) {
  const def = AGENTS.find((a) => a.id === agent.id);
  const Icon = iconMap[def?.icon ?? ""] ?? Brain;
  const color = agentColorMap[agent.id] ?? "#6366f1";
  const config = statusConfig[agent.status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: isActive ? 1.02 : 1,
      }}
      transition={{ duration: 0.3 }}
      className={cn(
        "glass relative overflow-hidden p-4 transition-all duration-300",
        config.border,
        config.glow,
        agent.status === "idle" && "opacity-60",
        isActive && "ring-1 ring-primary/30",
      )}
    >
      {agent.status === "running" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${color}20, transparent, ${color}20, transparent)`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
      )}

      <div className="relative z-10 flex items-start gap-3">
        <div className="relative">
          <motion.div
            animate={
              agent.status === "running"
                ? { rotate: 360 }
                : { rotate: 0 }
            }
            transition={
              agent.status === "running"
                ? { duration: 2, repeat: Infinity, ease: "linear" }
                : { duration: 0.3 }
            }
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
            )}
            style={{ backgroundColor: `${color}18` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </motion.div>

          {agent.status === "done" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-success"
            >
              <Check className="h-3 w-3 text-white" />
            </motion.div>
          )}

          {agent.status === "error" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error"
            >
              <X className="h-3 w-3 text-white" />
            </motion.div>
          )}

          {agent.status === "running" && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -inset-1 rounded-xl opacity-30"
              style={{ backgroundColor: `${color}30` }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-semibold text-text-primary truncate">
              {def?.name ?? agent.name}
            </h4>
            {agent.status === "running" && (
              <Loader2 className="h-3 w-3 animate-spin text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-text-muted truncate">
            {def?.role ?? agent.role}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                config.iconColor,
              )}
              style={{
                backgroundColor: `${color}15`,
              }}
            >
              {config.label}
            </span>
            {agent.duration !== undefined && (
              <span className="text-[10px] text-text-dim">
                {agent.duration < 1000
                  ? `${agent.duration}ms`
                  : `${(agent.duration / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>
        </div>
      </div>

      {agent.status === "done" && agent.output && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-3 overflow-hidden"
        >
          <p className="text-xs leading-relaxed text-text-muted line-clamp-2">
            {agent.output}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
