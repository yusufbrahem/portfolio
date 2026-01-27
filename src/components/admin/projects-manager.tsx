"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X, Save, Loader2 } from "lucide-react";
import {
  createProject,
  updateProject,
  deleteProject,
  getProjects,
  type getProjects as GetProjects,
} from "@/app/actions/projects";
import { ItemVisibilityToggle } from "@/components/admin/item-visibility-toggle";
import { updateProjectVisibility } from "@/app/actions/item-visibility";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";
import { CharCounter } from "@/components/ui/char-counter";

type Project = Awaited<ReturnType<typeof GetProjects>>[0];

export function ProjectsManager({
  initialData,
  isReadOnly = false,
  platformMenuId,
}: {
  initialData: Project[];
  isReadOnly?: boolean;
  platformMenuId: string;
}) {
  const [projects, setProjects] = useState(initialData);
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
    summary: string;
    bullets: string[];
    tags: string[];
  }) => {
    setLoading("create");
    setError(null);
    try {
      const order = projects.length;
      const newProject = await createProject({ ...data, order, platformMenuId });
      setProjects([...projects, newProject]);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdate = async (
    id: string,
    data: {
      title: string;
      summary: string;
      bullets: string[];
      tags: string[];
    },
  ) => {
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    setLoading(id);
    setError(null);
    try {
      await updateProject(id, { ...data, order: project.order });
      setProjects(
        projects.map((p) =>
          p.id === id
            ? {
                ...p,
                ...data,
                bullets: data.bullets.map((text, i) => ({ id: `temp-${i}`, projectId: id, text, order: i, createdAt: new Date() })),
                tags: data.tags.map((name, i) => ({ id: `temp-${i}`, projectId: id, name, order: i, createdAt: new Date() })),
              }
            : p,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    setLoading(id);
    setError(null);
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Projects</h2>
        {!isCreating && (
          <button
            onClick={handleCreate}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isCreating && (
        <ProjectForm
          onSave={handleSaveNew}
          onCancel={() => {
            setIsCreating(false);
            setError(null);
          }}
          loading={loading === "create"}
        />
      )}

      {projects.length === 0 && !isCreating ? (
        <div className="border border-border bg-panel rounded-lg p-8 text-center">
          <p className="text-muted">No projects yet. Create your first project to get started.</p>
        </div>
      ) : (
        projects.map((project) =>
        editingId === project.id ? (
          <ProjectForm
            key={project.id}
            project={project}
            onSave={(data) => handleUpdate(project.id, data)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={project.id} className="border border-border bg-panel rounded-lg p-4 overflow-hidden">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="font-semibold text-foreground mb-1 break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{project.title}</h3>
                <p className="text-sm text-muted break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{project.summary}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {loading === project.id && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
                <ItemVisibilityToggle
                  itemId={project.id}
                  initialValue={project.isVisible ?? true}
                  onToggle={async (id, isVisible) => {
                    await updateProjectVisibility(id, isVisible);
                    setProjects(projects.map(p => p.id === id ? { ...p, isVisible } : p));
                  }}
                  isReadOnly={isReadOnly}
                />
                <button
                  onClick={() => setEditingId(project.id)}
                  className="text-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading === project.id || isReadOnly}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading === project.id || isReadOnly}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 overflow-hidden">
              <div>
                <p className="text-xs text-muted-disabled mb-1">Bullets:</p>
                <ul className="text-sm text-muted space-y-1 break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                  {project.bullets.map((b) => (
                    <li key={b.id} className="break-words" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>• {b.text}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-disabled mb-1">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((t) => (
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

function ProjectForm({
  project,
  onSave,
  onCancel,
  loading,
}: {
  project?: Project;
  onSave: (data: { title: string; summary: string; bullets: string[]; tags: string[] }) => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [title, setTitle] = useState(project?.title || "");
  const [summary, setSummary] = useState(project?.summary || "");
  const [bullets, setBullets] = useState<string[]>(project?.bullets.map((b) => b.text) || []);
  const [tags, setTags] = useState<string[]>(project?.tags.map((t) => t.name) || []);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [bulletErrors, setBulletErrors] = useState<(string | null)[]>([]);
  const [tagErrors, setTagErrors] = useState<(string | null)[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary) return;
    
    // Validate lengths
    const titleValidation = validateTextLength(title, TEXT_LIMITS.TITLE, "Title");
    if (!titleValidation.isValid) {
      setTitleError(titleValidation.error);
      return;
    }
    
    const summaryValidation = validateTextLength(summary, TEXT_LIMITS.SUMMARY, "Summary");
    if (!summaryValidation.isValid) {
      setSummaryError(summaryValidation.error);
      return;
    }
    
    // Validate bullets
    const bulletValidationErrors: (string | null)[] = [];
    for (const bullet of bullets) {
      if (bullet.trim()) {
        const validation = validateTextLength(bullet, TEXT_LIMITS.BULLET, "Bullet point");
        bulletValidationErrors.push(validation.error);
      } else {
        bulletValidationErrors.push(null);
      }
    }
    setBulletErrors(bulletValidationErrors);
    if (bulletValidationErrors.some(err => err !== null)) {
      return;
    }
    
    // Validate tags
    const tagValidationErrors: (string | null)[] = [];
    for (const tag of tags) {
      if (tag.trim()) {
        const validation = validateTextLength(tag, TEXT_LIMITS.TAG, "Tag");
        tagValidationErrors.push(validation.error);
      } else {
        tagValidationErrors.push(null);
      }
    }
    setTagErrors(tagValidationErrors);
    if (tagValidationErrors.some(err => err !== null)) {
      return;
    }
    
    onSave({ title, summary, bullets, tags });
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

  const addTag = () => {
    setTags([...tags, ""]);
  };

  const updateTag = (index: number, value: string) => {
    setTags(tags.map((t, i) => (i === index ? value : t)));
    // Validate tag length
    if (value.trim()) {
      const validation = validateTextLength(value, TEXT_LIMITS.TAG, "Tag");
      const newErrors = [...tagErrors];
      newErrors[index] = validation.error;
      setTagErrors(newErrors);
    } else {
      const newErrors = [...tagErrors];
      newErrors[index] = null;
      setTagErrors(newErrors);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-panel rounded-lg p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Title</label>
        <input
          type="text"
          value={title}
          maxLength={TEXT_LIMITS.TITLE}
          onChange={(e) => {
            const value = e.target.value;
            setTitle(value);
            const validation = validateTextLength(value, TEXT_LIMITS.TITLE, "Title");
            setTitleError(validation.error);
          }}
          className={`w-full px-3 py-2 border rounded-lg ${
            titleError
              ? "border-red-500 bg-red-500/10"
              : "border-border bg-background text-foreground"
          }`}
          required
        />
        <CharCounter current={title.length} max={TEXT_LIMITS.TITLE} />
        {titleError && <p className="mt-1 text-xs text-red-400">{titleError}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Summary</label>
        <textarea
          value={summary}
          maxLength={TEXT_LIMITS.SUMMARY}
          onChange={(e) => {
            const value = e.target.value;
            setSummary(value);
            const validation = validateTextLength(value, TEXT_LIMITS.SUMMARY, "Summary");
            setSummaryError(validation.error);
          }}
          className={`w-full px-3 py-2 border rounded-lg ${
            summaryError
              ? "border-red-500 bg-red-500/10"
              : "border-border bg-background text-foreground"
          }`}
          rows={3}
          required
        />
        <CharCounter current={summary.length} max={TEXT_LIMITS.SUMMARY} />
        {summaryError && <p className="mt-1 text-xs text-red-400">{summaryError}</p>}
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
          <label className="block text-sm font-medium text-foreground">Tags</label>
          <button type="button" onClick={addTag} className="text-sm text-accent hover:text-blue-400">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <div key={index} className="flex items-center gap-1">
              <input
                type="text"
                value={tag}
                onChange={(e) => updateTag(index, e.target.value)}
                className="px-2 py-1 border border-border bg-background text-foreground rounded text-sm"
                placeholder="Tag"
              />
              <button type="button" onClick={() => removeTag(index)} className="text-red-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
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
