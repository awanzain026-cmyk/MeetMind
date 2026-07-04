"use client";

import { useState, useCallback } from "react";

export function useClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetDelay);
      } catch {
        /* clipboard write failed */
      }
    },
    [resetDelay],
  );

  return { copied, copy };
}
