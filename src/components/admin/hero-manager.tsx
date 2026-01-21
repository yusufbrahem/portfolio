"use client";

import { useMemo, useState } from "react";
import { Save, Plus, X } from "lucide-react";
import { updateHeroContent } from "@/app/actions/hero";

type HeroRecord = {
  headline: string;
  subheadline: string;
  highlights: string; // JSON in DB
} | null;

export function HeroManager({ initialData, isReadOnly = false }: { initialData: HeroRecord; isReadOnly?: boolean }) {
  const [hero, setHero] = useState<HeroRecord>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const beginCreate = () => {
    setHero({ headline: "", subheadline: "", highlights: "[]" });
    setForm({ headline: "", subheadline: "", highlights: "" });
    setIsEditing(true);
  };

  const beginEdit = () => {
    setForm({
      headline: hero?.headline || "",
      subheadline: hero?.subheadline || "",
      highlights: parsedHighlights.join("\n"),
    });
    setIsEditing(true);
  };

  const cancel = () => {
    setError(null);
    setIsEditing(false);
    setForm({
      headline: hero?.headline || "",
      subheadline: hero?.subheadline || "",
      highlights: parsedHighlights.join("\n"),
    });
  };

  const save = async () => {
    setError(null);
    try {
      const highlights = form.highlights
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
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
        {!isReadOnly && (
          <button
            onClick={beginCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create hero section
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="border border-border bg-panel rounded-lg p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">Hero</h2>
        {!isEditing && !isReadOnly ? (
          <button
            onClick={beginEdit}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel2 text-foreground rounded-lg hover:bg-panel transition-colors"
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
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Subheadline</label>
            <textarea
              value={form.subheadline}
              onChange={(e) => setForm({ ...form, subheadline: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg min-h-[96px]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Highlights (one per line)
            </label>
            <textarea
              value={form.highlights}
              onChange={(e) => setForm({ ...form, highlights: e.target.value })}
              className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg min-h-[120px]"
              placeholder={"Secure APIs\nIdentity & access\nTransaction integrity"}
            />
          </div>
          <button
            onClick={save}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors"
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
            {parsedHighlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

