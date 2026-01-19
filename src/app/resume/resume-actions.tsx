"use client";

import { Printer } from "lucide-react";

export function ResumeActions() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-panel px-5 py-2.5 font-semibold tracking-tight text-foreground transition-colors hover:bg-panel2"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print / Save as PDF
    </button>
  );
}

