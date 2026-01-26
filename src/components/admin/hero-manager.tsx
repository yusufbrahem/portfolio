"use client";

import { useMemo, useState } from "react";
import { Save, Plus, X, Sparkles } from "lucide-react";
import { updateHeroContent } from "@/app/actions/hero";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";
import { CharCounter } from "@/components/ui/char-counter";

type HeroRecord = {
  headline: string;
  subheadline: string;
  highlights: string; // JSON in DB
} | null;

type PersonInfo = {
  name: string;
  role: string;
} | null;

export function HeroManager({ 
  initialData, 
  personInfo,
  isReadOnly = false 
}: { 
  initialData: HeroRecord; 
  personInfo?: PersonInfo;
  isReadOnly?: boolean;
}) {
  const [hero, setHero] = useState<HeroRecord>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const parsedHighlights = useMemo(() => {
    if (!hero) return [] as string[];
    try {
      const v = JSON.parse(hero.highlights || "[]");
      return Array.isArray(v) ? (v as string[]) : [];
    } catch {
      return [];
    }
  }, [hero]);

  const [form, setForm] = useState({
    headline: hero?.headline || "",
    subheadline: hero?.subheadline || "",
    highlights: parsedHighlights.join("\n"),
  });
  const [headlineError, setHeadlineError] = useState<string | null>(null);
  const [subheadlineError, setSubheadlineError] = useState<string | null>(null);
  const [highlightsErrors, setHighlightsErrors] = useState<(string | null)[]>([]);

  // Generate smart default headline from PersonInfo
  const getSmartDefaultHeadline = (): string => {
    if (!personInfo || !personInfo.name || !personInfo.role) {
      return "";
    }
    return `${personInfo.name} — ${personInfo.role}`;
  };

  const beginCreate = () => {
    setIsCreating(true);
    setHero({ headline: "", subheadline: "", highlights: "[]" });
    const defaultHeadline = getSmartDefaultHeadline();
    setForm({ 
      headline: defaultHeadline, 
      subheadline: "", 
      highlights: "" 
    });
    setIsEditing(true);
  };

  const beginEdit = () => {
    setIsCreating(false);
    // If headline is empty, pre-fill with smart default
    const currentHeadline = hero?.headline || "";
    const defaultHeadline = !currentHeadline ? getSmartDefaultHeadline() : currentHeadline;
    setForm({
      headline: defaultHeadline,
      subheadline: hero?.subheadline || "",
      highlights: parsedHighlights.join("\n"),
    });
    setIsEditing(true);
  };

  const cancel = () => {
    setError(null);
    setIsEditing(false);
    setIsCreating(false);
    setForm({
      headline: hero?.headline || "",
      subheadline: hero?.subheadline || "",
      highlights: parsedHighlights.join("\n"),
    });
  };

  const save = async () => {
    setError(null);
    setHeadlineError(null);
    setSubheadlineError(null);
    setHighlightsErrors([]);
    
    // Validate headline
    const headlineValidation = validateTextLength(form.headline.trim(), TEXT_LIMITS.HEADLINE, "Headline");
    if (!headlineValidation.isValid) {
      setHeadlineError(headlineValidation.error);
      return;
    }
    
    // Validate subheadline
    const subheadlineValidation = validateTextLength(form.subheadline.trim(), TEXT_LIMITS.SUBHEADLINE, "Subheadline");
    if (!subheadlineValidation.isValid) {
      setSubheadlineError(subheadlineValidation.error);
      return;
    }
    
    // Validate highlights
    const highlights = form.highlights
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    
    const highlightValidationErrors: (string | null)[] = [];
    for (const highlight of highlights) {
      const validation = validateTextLength(highlight, TEXT_LIMITS.HIGHLIGHT, "Highlight");
      highlightValidationErrors.push(validation.error);
    }
    setHighlightsErrors(highlightValidationErrors);
    if (highlightValidationErrors.some(err => err !== null)) {
      return;
    }
    
    try {
      const result = await updateHeroContent({
        headline: form.headline.trim(),
        subheadline: form.subheadline.trim(),
        highlights,
      });
      setHero({
        headline: result.headline,
        subheadline: result.subheadline,
        highlights: result.highlights || "[]",
      });
      setIsEditing(false);
      setIsCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save hero content");
    }
  };

  if (!hero && !isEditing) {
    return (
      <div className="border border-border bg-panel rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Hero</h2>
        </div>
        <p className="mt-2 text-sm text-muted">No hero section yet for this portfolio.</p>
        <button
          onClick={beginCreate}
          disabled={isReadOnly}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          Create hero section
        </button>
      </div>
    );
  }

  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">Hero</h2>
        {!isEditing ? (
          <button
            onClick={beginEdit}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel2 text-foreground rounded-lg hover:bg-panel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Edit
          </button>
        ) : (
          <button
            onClick={cancel}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel2 text-foreground rounded-lg hover:bg-panel transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isEditing ? (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Headline</label>
            <input
              type="text"
              value={form.headline}
              maxLength={TEXT_LIMITS.HEADLINE}
              onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, headline: value });
                const validation = validateTextLength(value, TEXT_LIMITS.HEADLINE, "Headline");
                setHeadlineError(validation.error);
              }}
              disabled={isReadOnly}
              className={`w-full px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                headlineError
                  ? "border-red-500 bg-red-500/10"
                  : "border-border bg-background text-foreground"
              }`}
              required
            />
            <CharCounter current={form.headline.length} max={TEXT_LIMITS.HEADLINE} />
            {headlineError && <p className="mt-1 text-xs text-red-400">{headlineError}</p>}
            {isCreating && (!personInfo || !personInfo.name || !personInfo.role) && (
              <p className="mt-1 text-xs text-muted">
                Add your name and role in Profile settings to auto-generate this headline.
              </p>
            )}
            {((isCreating || !hero?.headline) && personInfo?.name && personInfo?.role && form.headline === getSmartDefaultHeadline()) && (
              <p className="mt-1.5 text-xs text-muted flex items-center gap-1.5 animate-pulse">
                <Sparkles className="h-3 w-3 text-accent" />
                <span>Suggested from your profile</span>
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Subheadline</label>
            <textarea
              value={form.subheadline}
              maxLength={TEXT_LIMITS.SUBHEADLINE}
              onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, subheadline: value });
                const validation = validateTextLength(value, TEXT_LIMITS.SUBHEADLINE, "Subheadline");
                setSubheadlineError(validation.error);
              }}
              disabled={isReadOnly}
              className={`w-full px-4 py-2 border rounded-lg min-h-[96px] disabled:opacity-50 disabled:cursor-not-allowed ${
                subheadlineError
                  ? "border-red-500 bg-red-500/10"
                  : "border-border bg-background text-foreground"
              }`}
              required
            />
            <CharCounter current={form.subheadline.length} max={TEXT_LIMITS.SUBHEADLINE} />
            {subheadlineError && <p className="mt-1 text-xs text-red-400">{subheadlineError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Highlights (one per line, max {TEXT_LIMITS.HIGHLIGHT} chars each)
            </label>
            <textarea
              value={form.highlights}
              onChange={(e) => {
                const value = e.target.value;
                setForm({ ...form, highlights: value });
                // Validate each line
                const lines = value.split("\n").map(x => x.trim()).filter(Boolean);
                const errors: (string | null)[] = [];
                for (const line of lines) {
                  const validation = validateTextLength(line, TEXT_LIMITS.HIGHLIGHT, "Highlight");
                  errors.push(validation.error);
                }
                setHighlightsErrors(errors);
              }}
              disabled={isReadOnly}
              className={`w-full px-4 py-2 border rounded-lg min-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed ${
                highlightsErrors.some(err => err !== null)
                  ? "border-red-500 bg-red-500/10"
                  : "border-border bg-background text-foreground"
              }`}
              placeholder={"Secure APIs\nIdentity & access\nTransaction integrity"}
            />
            <div className="mt-1 space-y-1">
              {form.highlights.split("\n").map((line, idx) => {
                if (!line.trim()) return null;
                return (
                  <div key={idx}>
                    <CharCounter current={line.trim().length} max={TEXT_LIMITS.HIGHLIGHT} />
                    {highlightsErrors[idx] && (
                      <p className="text-xs text-red-400">{highlightsErrors[idx]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={save}
            disabled={
              isReadOnly || 
              !!headlineError || 
              !!subheadlineError || 
              highlightsErrors.some(err => err !== null)
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            Save hero
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-disabled">Headline</p>
          <p className="text-base text-foreground">{hero?.headline}</p>
          <p className="text-sm text-muted-disabled">Subheadline</p>
          <p className="text-sm text-muted">{hero?.subheadline}</p>
          <p className="text-sm text-muted-disabled">Highlights</p>
          <ul className="list-disc pl-5 text-sm text-muted">
            {parsedHighlights.map((h, idx) => (
              <li key={`highlight-${idx}`}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

