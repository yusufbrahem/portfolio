"use client";

import { useState, useTransition } from "react";
import { Save, Loader2 } from "lucide-react";
import { updatePortfolioIntros } from "@/app/actions/portfolio-intros";
import { DEFAULT_SECTION_INTROS } from "@/lib/section-intros";

type SectionIntroEditorProps = {
  section: "skills" | "projects" | "experience" | "architecture";
  initialValue: string | null | undefined;
  isReadOnly?: boolean;
};

export function SectionIntroEditor({
  section,
  initialValue,
  isReadOnly = false,
}: SectionIntroEditorProps) {
  const [value, setValue] = useState(
    initialValue || DEFAULT_SECTION_INTROS[section]
  );
  const [isSaving, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        await updatePortfolioIntros({
          [`${section}Intro`]: value.trim() || null,
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save introduction");
      }
    });
  };

  const sectionLabels = {
    skills: "Skills Section Introduction",
    projects: "Projects Section Introduction",
    experience: "Experience Section Introduction",
    architecture: "Architecture Section Introduction",
  };

  return (
    <div className="border border-border bg-panel rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {sectionLabels[section]}
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            rows={2}
            disabled={isSaving || isReadOnly}
          />
          <p className="mt-1 text-xs text-muted">
            Edit or replace the default introduction. Clear the field to use the default on your public portfolio.
          </p>
        </div>

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400">Introduction saved successfully!</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || isReadOnly}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Introduction
            </>
          )}
        </button>
      </form>
    </div>
  );
}
