"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: "primary" | "accent";
}

export function Card({
  children,
  className,
  glow = false,
  glowColor = "primary",
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "glass",
        glow && glowColor === "primary" && "glow-primary",
        glow && glowColor === "accent" && "glow-accent",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
