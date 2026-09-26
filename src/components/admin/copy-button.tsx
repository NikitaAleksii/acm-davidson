"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      aria-label={copied ? "Copied" : label}
      title={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-default text-muted hover:bg-surface-muted hover:text-fg"
    >
      {copied ? <Check size={14} aria-hidden className="text-green-600" /> : <Copy size={14} aria-hidden />}
    </button>
  );
}
