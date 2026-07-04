"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "idle"
  | "running"
  | "done"
  | "error"
  | "high"
  | "medium"
  | "low";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  idle: "bg-text-dim/20 text-text-muted",
  running: "bg-primary/20 text-primary",
  done: "bg-success/20 text-success",
  error: "bg-error/20 text-error",
  high: "bg-error/20 text-error",
  medium: "bg-warning/20 text-warning",
  low: "bg-text-dim/20 text-text-muted",
};

const pulseVariants: Record<BadgeVariant, boolean> = {
  idle: false,
  running: true,
  done: false,
  error: false,
  high: false,
  medium: false,
  low: false,
};

export function Badge({
  children,
  variant = "idle",
  className,
}: BadgeProps) {
  const shouldPulse = pulseVariants[variant];

  return (
    <motion.span
      animate={
        shouldPulse
          ? {
              opacity: [1, 0.6, 1],
              scale: [1, 1.05, 1],
            }
          : undefined
      }
      transition={
        shouldPulse
          ? {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : undefined
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {shouldPulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {children}
    </motion.span>
  );
}
