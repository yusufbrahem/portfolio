"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X, Save, Loader2, Calendar } from "lucide-react";
import {
  createExperience,
  updateExperience,
  deleteExperience,
  getExperiences,
  type getExperiences as GetExperiences,
} from "@/app/actions/experience";
import { CustomMonthPicker } from "@/components/admin/custom-month-picker";
import { ItemVisibilityToggle } from "@/components/admin/item-visibility-toggle";
import { updateExperienceVisibility } from "@/app/actions/item-visibility";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";
import { CharCounter } from "@/components/ui/char-counter";

type Experience = Awaited<ReturnType<typeof GetExperiences>>[0];

export function ExperienceManager({
  initialData,
  isReadOnly = false,
  platformMenuId,
}: {
  initialData: Experience[];
  isReadOnly?: boolean;
  platformMenuId: string;
}) {
  const [experiences, setExperiences] = useState(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
  };

  const handleSaveNew = async (data: {
    title: string;
    company: string;
    location: string;
    period: string;
    bullets: string[];
    tech: string[];
  }) => {
    setLoading("create");
    setError(null);
    try {
      const order = experiences.length;
      const newExperience = await createExperience({ platformMenuId, ...data, order });
      setExperiences([...experiences, newExperience]);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create experience");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdate = async (
    id: string,
    data: {
      title: string;
      company: string;
      location: string;
      period: string;
      bullets: string[];
      tech: string[];
    },
  ) => {
    const exp = experiences.find((e) => e.id === id);
    if (!exp) return;
    setLoading(id);
    setError(null);
    try {
      await updateExperience(id, { ...data, order: exp.order });
      setExperiences(
        experiences.map((e) =>
          e.id === id
            ? {
                ...e,
                ...data,
                bullets: data.bullets.map((text, i) => ({ id: `temp-${i}`, experienceId: id, text, order: i, createdAt: new Date() })),
                tech: data.tech.map((name, i) => ({ id: `temp-${i}`, experienceId: id, name, order: i, createdAt: new Date() })),
              }
            : e,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update experience");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this experience entry?")) return;
    setLoading(id);
    setError(null);
    try {
      await deleteExperience(id);
      setExperiences(experiences.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete experience");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Experience Entries</h2>
        {!isCreating && (
          <button
            onClick={handleCreate}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add Experience
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isCreating && (
        <ExperienceForm
          onSave={handleSaveNew}
          onCancel={() => {
            setIsCreating(false);
            setError(null);
          }}
          loading={loading === "create"}
          isReadOnly={isReadOnly}
        />
      )}

      {experiences.length === 0 && !isCreating ? (
        <div className="border border-border bg-panel rounded-lg p-8 text-center">
          <p className="text-muted">No experience entries yet. Create your first entry to get started.</p>
        </div>
      ) : (
        experiences.map((exp) =>
        editingId === exp.id ? (
          <ExperienceForm
            key={exp.id}
            experience={exp}
            onSave={(data) => handleUpdate(exp.id, data)}
            onCancel={() => setEditingId(null)}
            isReadOnly={isReadOnly}
          />
        ) : (
          <div key={exp.id} className="border border-border bg-panel rounded-lg p-4 overflow-hidden">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="font-semibold text-foreground mb-1 break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{exp.title}</h3>
                <p className="text-sm text-muted break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{exp.company}</p>
                <p className="text-xs text-muted-disabled break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{exp.location} • {exp.period}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {loading === exp.id && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
                <ItemVisibilityToggle
                  itemId={exp.id}
                  initialValue={exp.isVisible ?? true}
                  onToggle={async (id, isVisible) => {
                    await updateExperienceVisibility(id, isVisible);
                    setExperiences(experiences.map(e => e.id === id ? { ...e, isVisible } : e));
                  }}
                  isReadOnly={isReadOnly}
                />
                <button
                  onClick={() => setEditingId(exp.id)}
                  className="text-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading === exp.id || isReadOnly}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading === exp.id || isReadOnly}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 overflow-hidden">
              <div>
                <p className="text-xs text-muted-disabled mb-1">Bullets:</p>
                <ul className="text-sm text-muted space-y-1 break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {exp.bullets.map((b) => (
                    <li key={b.id} className="break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>• {b.text}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-disabled mb-1">Tech:</p>
                <div className="flex flex-wrap gap-2">
                  {exp.tech.map((t) => (
                    <span key={t.id} className="text-xs px-2 py-1 bg-panel2 rounded break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ),
      ))}
    </div>
  );
}

// Parse period string to extract dates
function parsePeriod(period: string): { from: string; to: string | null; isPresent: boolean } {
  if (!period) return { from: "", to: null, isPresent: false };
  
  // Check for "Present" or similar
  if (period.toLowerCase().includes("present") || period.toLowerCase().includes("current")) {
    const match = period.match(/(\d{4}-\d{2})/);
    return { from: match ? match[1] : "", to: null, isPresent: true };
  }
  
  // Try to parse "YYYY-MM to YYYY-MM" or "YYYY-MM - YYYY-MM"
  const match = period.match(/(\d{4}-\d{2})\s*(?:to|-)\s*(\d{4}-\d{2})/i);
  if (match) {
    return { from: match[1], to: match[2], isPresent: false };
  }
  
  // Try to parse single date
  const singleMatch = period.match(/(\d{4}-\d{2})/);
  if (singleMatch) {
    return { from: singleMatch[1], to: null, isPresent: false };
  }
  
  return { from: "", to: null, isPresent: false };
}

// Format dates to period string
function formatPeriod(from: string, to: string | null, isPresent: boolean): string {
  if (!from) return "";
  if (isPresent || !to) {
    return `${from} to Present`;
  }
  return `${from} to ${to}`;
}

// Calculate duration in years and months
function calculateDuration(from: string, to: string | null, isPresent: boolean): string {
  if (!from) return "";
  
  const fromDate = new Date(from + "-01");
  const toDate = isPresent ? new Date() : (to ? new Date(to + "-01") : new Date());
  
  if (toDate < fromDate) return "";
  
  let years = toDate.getFullYear() - fromDate.getFullYear();
  let months = toDate.getMonth() - fromDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (years === 0 && months === 0) {
    return "Less than 1 month";
  }
  
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }
  
  return parts.join(" ");
}

function ExperienceForm({
  experience,
  onSave,
  onCancel,
  loading,
  isReadOnly = false,
}: {
  experience?: Experience;
  onSave: (data: { title: string; company: string; location: string; period: string; bullets: string[]; tech: string[] }) => void;
  onCancel: () => void;
  loading?: boolean;
  isReadOnly?: boolean;
}) {
  const parsedPeriod = parsePeriod(experience?.period || "");
  const [title, setTitle] = useState(experience?.title || "");
  const [company, setCompany] = useState(experience?.company || "");
  const [location, setLocation] = useState(experience?.location || "");
  const [fromDate, setFromDate] = useState(parsedPeriod.from);
  const [toDate, setToDate] = useState(parsedPeriod.to || "");
  const [isPresent, setIsPresent] = useState(parsedPeriod.isPresent);
  const [locationType, setLocationType] = useState<"custom" | "remote" | "freelance" | "hybrid">(
    experience?.location === "Remote" ? "remote" :
    experience?.location === "Freelance" ? "freelance" :
    experience?.location === "Hybrid" ? "hybrid" : "custom"
  );
  const [bullets, setBullets] = useState<string[]>(experience?.bullets.map((b) => b.text) || []);
  const [tech, setTech] = useState<string[]>(experience?.tech.map((t) => t.name) || []);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [bulletErrors, setBulletErrors] = useState<(string | null)[]>([]);
  const [techErrors, setTechErrors] = useState<(string | null)[]>([]);
  
  const duration = calculateDuration(fromDate, isPresent ? null : toDate, isPresent);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company) return;
    
    // Validate dates
    if (!fromDate) {
      alert("Please select a start date");
      return;
    }
    
    const fromDateObj = new Date(fromDate + "-01");
    if (fromDateObj > new Date()) {
      alert("Start date cannot be in the future");
      return;
    }
    
    if (!isPresent && toDate) {
      const toDateObj = new Date(toDate + "-01");
      if (toDateObj < fromDateObj) {
        alert("End date must be after start date");
        return;
      }
    }
    
    // Validate location
    const finalLocation = location.trim();
    if (!finalLocation) {
      alert("Please enter a location or select a location type");
      return;
    }
    
    const locationValidation = validateTextLength(finalLocation, TEXT_LIMITS.LABEL, "Location");
    if (!locationValidation.isValid) {
      setLocationError(locationValidation.error);
      return;
    }
    
    const period = formatPeriod(fromDate, isPresent ? null : toDate, isPresent);
    onSave({ title, company, location: finalLocation, period, bullets, tech });
  };

  const addBullet = () => {
    setBullets([...bullets, ""]);
  };

  const updateBullet = (index: number, value: string) => {
    setBullets(bullets.map((b, i) => (i === index ? value : b)));
    // Validate bullet length
    if (value.trim()) {
      const validation = validateTextLength(value, TEXT_LIMITS.BULLET, "Bullet point");
      const newErrors = [...bulletErrors];
      newErrors[index] = validation.error;
      setBulletErrors(newErrors);
    } else {
      const newErrors = [...bulletErrors];
      newErrors[index] = null;
      setBulletErrors(newErrors);
    }
  };

  const removeBullet = (index: number) => {
    setBullets(bullets.filter((_, i) => i !== index));
  };

  const addTech = () => {
    setTech([...tech, ""]);
  };

  const updateTech = (index: number, value: string) => {
    setTech(tech.map((t, i) => (i === index ? value : t)));
    // Validate tech length
    if (value.trim()) {
      const validation = validateTextLength(value, TEXT_LIMITS.TAG, "Technology");
      const newErrors = [...techErrors];
      newErrors[index] = validation.error;
      setTechErrors(newErrors);
    } else {
      const newErrors = [...techErrors];
      newErrors[index] = null;
      setTechErrors(newErrors);
    }
  };

  const removeTech = (index: number) => {
    setTech(tech.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-panel rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 items-start">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Location <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={location}
              maxLength={TEXT_LIMITS.LABEL}
              onChange={(e) => {
                const value = e.target.value;
                setLocation(value);
                // If user types, switch to custom mode
                if (locationType !== "custom") {
                  setLocationType("custom");
                }
                const validation = validateTextLength(value, TEXT_LIMITS.LABEL, "Location");
                setLocationError(validation.error);
              }}
              placeholder="City, Country"
              className={`w-full px-4 py-2 border rounded-lg h-[2.5rem] ${
                locationError
                  ? "border-red-500 bg-red-500/10"
                  : "border-border bg-background text-foreground"
              }`}
              required
            />
            <CharCounter current={location.length} max={TEXT_LIMITS.LABEL} />
            {locationError && <p className="mt-1 text-xs text-red-400">{locationError}</p>}
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (locationType === "remote") {
                    setLocationType("custom");
                    setLocation("");
                  } else {
                    setLocationType("remote");
                    setLocation("Remote");
                  }
                }}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  locationType === "remote"
                    ? "bg-accent text-foreground border-accent"
                    : "bg-panel2 text-muted border-border hover:bg-panel"
                }`}
              >
                Remote
              </button>
              <button
                type="button"
                onClick={() => {
                  if (locationType === "freelance") {
                    setLocationType("custom");
                    setLocation("");
                  } else {
                    setLocationType("freelance");
                    setLocation("Freelance");
                  }
                }}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  locationType === "freelance"
                    ? "bg-accent text-foreground border-accent"
                    : "bg-panel2 text-muted border-border hover:bg-panel"
                }`}
              >
                Freelance
              </button>
              <button
                type="button"
                onClick={() => {
                  if (locationType === "hybrid") {
                    setLocationType("custom");
                    setLocation("");
                  } else {
                    setLocationType("hybrid");
                    setLocation("Hybrid");
                  }
                }}
                className={`px-3 py-1 text-xs rounded border transition-colors ${
                  locationType === "hybrid"
                    ? "bg-accent text-foreground border-accent"
                    : "bg-panel2 text-muted border-border hover:bg-panel"
                }`}
              >
                Hybrid
              </button>
            </div>
            <p className="text-xs text-muted">Quick options or enter custom location</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">From</label>
            <CustomMonthPicker
              value={fromDate}
              onChange={(value) => setFromDate(value || "")}
              placeholder="Select month"
              required
              maxDate={new Date()}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">To</label>
            {!isPresent ? (
              <CustomMonthPicker
                value={toDate}
                onChange={(value) => setToDate(value || "")}
                placeholder="Select month"
                maxDate={new Date()}
                minDate={fromDate ? new Date(fromDate + "-01") : undefined}
                disabled={isReadOnly}
              />
            ) : (
              <div className="px-3 py-2 border border-border bg-panel2 text-muted rounded-lg text-sm flex items-center gap-2 h-[2.5rem]">
                <Calendar className="h-4 w-4" />
                Present
              </div>
            )}
          </div>
          <div className="col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={isPresent}
                onChange={(e) => {
                  setIsPresent(e.target.checked);
                  if (e.target.checked) setToDate("");
                }}
                disabled={isReadOnly}
                className="rounded border-border cursor-pointer"
              />
              I still work here
            </label>
            {duration && (
              <p className="text-xs text-muted flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Duration: {duration}
              </p>
            )}
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">Bullets</label>
          <button type="button" onClick={addBullet} className="text-sm text-accent hover:text-blue-400">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {bullets.map((bullet, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bullet}
                  maxLength={TEXT_LIMITS.BULLET}
                  onChange={(e) => updateBullet(index, e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-lg ${
                    bulletErrors[index]
                      ? "border-red-500 bg-red-500/10"
                      : "border-border bg-background text-foreground"
                  }`}
                  placeholder="Bullet point"
                />
                <button type="button" onClick={() => removeBullet(index)} className="text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <CharCounter current={bullet.length} max={TEXT_LIMITS.BULLET} />
                {bulletErrors[index] && (
                  <p className="text-xs text-red-400">{bulletErrors[index]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">Tech</label>
          <button type="button" onClick={addTech} className="text-sm text-accent hover:text-blue-400">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tech.map((t, index) => (
            <div key={index} className="flex items-center gap-1">
              <input
                type="text"
                value={t}
                maxLength={TEXT_LIMITS.TAG}
                onChange={(e) => updateTech(index, e.target.value)}
                className={`px-2 py-1 border rounded text-sm ${
                  techErrors[index]
                    ? "border-red-500 bg-red-500/10"
                    : "border-border bg-background text-foreground"
                }`}
                placeholder="Tech"
              />
              <button type="button" onClick={() => removeTech(index)} className="text-red-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={
            loading || 
            !title || 
            !company || 
            !!titleError || 
            !!companyError || 
            !!locationError || 
            bulletErrors.some(err => err !== null) || 
            techErrors.some(err => err !== null)
          }
          className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-border bg-panel2 text-foreground rounded-lg hover:bg-panel transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
