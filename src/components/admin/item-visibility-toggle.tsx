"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

type ItemVisibilityToggleProps = {
  itemId: string;
  initialValue: boolean;
  onToggle: (itemId: string, isVisible: boolean) => Promise<void>;
  isReadOnly?: boolean;
  label?: string;
};

export function ItemVisibilityToggle({
  itemId,
  initialValue,
  onToggle,
  isReadOnly = false,
  label,
}: ItemVisibilityToggleProps) {
  const [isVisible, setIsVisible] = useState(initialValue);
  const [isSaving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    if (isReadOnly || isSaving) return;

    const newValue = !isVisible;
    setIsVisible(newValue);
    setError(null);

    startTransition(async () => {
      try {
        await onToggle(itemId, newValue);
      } catch (err) {
        setIsVisible(!newValue); // Revert on error
        setError(err instanceof Error ? err.message : "Failed to update visibility");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isSaving || isReadOnly}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed items-center ${
          isVisible ? "bg-green-500" : "bg-gray-300"
        }`}
        role="switch"
        aria-checked={isVisible}
        aria-label={label || "Toggle item visibility"}
        title={isVisible ? "Visible on portfolio" : "Hidden from portfolio"}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
            isVisible ? "translate-x-4" : "translate-x-0.5"
          }`}
        >
          {isSaving && (
            <Loader2 className="h-2.5 w-2.5 animate-spin text-gray-600" />
          )}
        </span>
      </button>
      {error && (
        <span className="text-xs text-red-400" title={error}>
          ⚠
        </span>
      )}
    </div>
  );
}
