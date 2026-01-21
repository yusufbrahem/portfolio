"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-3 text-sm font-semibold text-foreground shadow-lg hover:bg-panel2 transition-colors"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      Top
    </button>
  );
}

