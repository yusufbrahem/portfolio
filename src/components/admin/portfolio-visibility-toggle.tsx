"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { updatePortfolioVisibility } from "@/app/actions/portfolio-visibility";

type PortfolioVisibilityToggleProps = {
  initialValue: boolean;
  isReadOnly?: boolean;
};

export function PortfolioVisibilityToggle({
  initialValue,
  isReadOnly = false,
}: PortfolioVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialValue);
  const [isSaving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = () => {
    if (isReadOnly || isSaving) return;

    const newValue = !isPublic;
    setIsPublic(newValue);
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await updatePortfolioVisibility(newValue);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } catch (err) {
        setIsPublic(!newValue); // Revert on error
        setError(err instanceof Error ? err.message : "Failed to update visibility");
      }
    });
  };

  return (
    <div className="border border-border bg-panel rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isPublic ? (
            <Eye className="h-5 w-5 text-green-400" />
          ) : (
            <EyeOff className="h-5 w-5 text-muted" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              Portfolio Visibility
            </p>
            <p className="text-xs text-muted mt-0.5">
              {isPublic
                ? "Your portfolio is publicly accessible"
                : "Your portfolio is hidden (404 for visitors)"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isSaving || isReadOnly}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isPublic ? "bg-green-500" : "bg-gray-300"
          }`}
          role="switch"
          aria-checked={isPublic}
          aria-label="Toggle portfolio visibility"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isPublic ? "translate-x-5" : "translate-x-0"
            }`}
          >
            {isSaving && (
              <Loader2 className="h-3 w-3 animate-spin text-gray-600 m-1" />
            )}
          </span>
        </button>
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-400">Visibility updated!</p>
        </div>
      )}
    </div>
  );
}
