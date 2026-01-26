"use client";

import { useState, useTransition } from "react";
import { Save, Loader2 } from "lucide-react";
import { updatePortfolioIntros, type getPortfolioIntros } from "@/app/actions/portfolio-intros";
import { DEFAULT_SECTION_INTROS } from "@/lib/section-intros";

type PortfolioIntros = Awaited<ReturnType<typeof getPortfolioIntros>>;

export function SectionIntrosManager({ 
  initialData,
  isReadOnly = false 
}: { 
  initialData: PortfolioIntros | null;
  isReadOnly?: boolean;
}) {
  // Pre-fill with defaults if user hasn't customized
  const [formData, setFormData] = useState({
    skillsIntro: initialData?.skillsIntro || DEFAULT_SECTION_INTROS.skills,
    projectsIntro: initialData?.projectsIntro || DEFAULT_SECTION_INTROS.projects,
    experienceIntro: initialData?.experienceIntro || DEFAULT_SECTION_INTROS.experience,
    architectureIntro: initialData?.architectureIntro || DEFAULT_SECTION_INTROS.architecture,
  });
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
          skillsIntro: formData.skillsIntro || null,
          projectsIntro: formData.projectsIntro || null,
          experienceIntro: formData.experienceIntro || null,
          architectureIntro: formData.architectureIntro || null,
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save section introductions");
      }
    });
  };

  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Section Introductions</h2>
        <p className="text-sm text-muted mt-1">
          Customize the introduction text for each section on your portfolio. Each field is pre-filled with a default introduction that you can edit, replace, or clear. If cleared, the default will be shown on your public portfolio.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-green-400">Section introductions saved successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Skills Section Introduction
          </label>
          <textarea
            value={formData.skillsIntro}
            onChange={(e) => setFormData({ ...formData, skillsIntro: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            rows={2}
            disabled={isSaving || isReadOnly}
          />
          <p className="mt-1 text-xs text-muted">Edit or replace the default introduction. Clear the field to use the default on your public portfolio.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Projects Section Introduction
          </label>
          <textarea
            value={formData.projectsIntro}
            onChange={(e) => setFormData({ ...formData, projectsIntro: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            rows={2}
            disabled={isSaving || isReadOnly}
          />
          <p className="mt-1 text-xs text-muted">Edit or replace the default introduction. Clear the field to use the default on your public portfolio.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Experience Section Introduction
          </label>
          <textarea
            value={formData.experienceIntro}
            onChange={(e) => setFormData({ ...formData, experienceIntro: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            rows={2}
            disabled={isSaving || isReadOnly}
          />
          <p className="mt-1 text-xs text-muted">Edit or replace the default introduction. Clear the field to use the default on your public portfolio.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Architecture Section Introduction
          </label>
          <textarea
            value={formData.architectureIntro}
            onChange={(e) => setFormData({ ...formData, architectureIntro: e.target.value })}
            className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            rows={2}
            disabled={isSaving || isReadOnly}
          />
          <p className="mt-1 text-xs text-muted">Edit or replace the default introduction. Clear the field to use the default on your public portfolio.</p>
        </div>

        <div className="flex items-center gap-2 pt-2">
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
                Save Introductions
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
