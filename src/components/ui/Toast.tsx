"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const config: Record<
  ToastVariant,
  { icon: LucideIcon; bg: string; border: string; iconColor: string }
> = {
  success: {
    icon: Check,
    bg: "bg-success/10",
    border: "border-success/20",
    iconColor: "text-success",
  },
  error: {
    icon: X,
    bg: "bg-error/10",
    border: "border-error/20",
    iconColor: "text-error",
  },
  info: {
    icon: Info,
    bg: "bg-primary/10",
    border: "border-primary/20",
    iconColor: "text-primary",
  },
};

export function ToastItem({ toast, onDismiss }: ToastProps) {
  const { icon: Icon, bg, border, iconColor } = config[toast.variant];

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm",
        bg,
        border,
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
      <p className="text-sm text-text-primary">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 flex cursor-pointer items-center justify-center rounded-md p-1 text-text-muted hover:text-text-primary transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, variant: ToastVariant = "info") => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, addToast, dismiss };
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
