"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark focus:ring-primary/50",
  secondary:
    "bg-surface2 text-text-primary border border-border hover:bg-surface focus:ring-primary/50",
  ghost:
    "bg-transparent text-text-muted hover:text-text-primary hover:bg-surface focus:ring-primary/50",
  danger:
    "bg-error/10 text-error border border-error/20 hover:bg-error/20 focus:ring-error/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
};

const omitMotionConflicting = ({
  onAnimationStart: _as,
  onDragEnd: _de,
  onDragStart: _ds,
  onDrag: _d,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) => rest;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background cursor-pointer",
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && "opacity-50 cursor-not-allowed",
          className,
        )}
        {...omitMotionConflicting(props)}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
