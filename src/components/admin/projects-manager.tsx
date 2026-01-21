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

type Project = Awaited<ReturnType<typeof GetProjects>>[0];

export function ProjectsManager({ initialData, isReadOnly = false }: { initialData: Project[]; isReadOnly?: boolean }) {
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
      const newProject = await createProject({ ...data, order });
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
          <div key={project.id} className="border border-border bg-panel rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
                <p className="text-sm text-muted">{project.summary}</p>
              </div>
              <div className="flex items-center gap-2">
                {loading === project.id && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
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
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-disabled mb-1">Bullets:</p>
                <ul className="text-sm text-muted space-y-1">
                  {project.bullets.map((b) => (
                    <li key={b.id}>• {b.text}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-disabled mb-1">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((t) => (
                    <span key={t.id} className="text-xs px-2 py-1 bg-panel2 rounded">
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary) return;
    onSave({ title, summary, bullets, tags });
  };

  const addBullet = () => {
    setBullets([...bullets, ""]);
  };

  const updateBullet = (index: number, value: string) => {
    setBullets(bullets.map((b, i) => (i === index ? value : b)));
  };

  const removeBullet = (index: number) => {
    setBullets(bullets.filter((_, i) => i !== index));
  };

  const addTag = () => {
    setTags([...tags, ""]);
  };

  const updateTag = (index: number, value: string) => {
    setTags(tags.map((t, i) => (i === index ? value : t)));
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
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg"
          rows={3}
          required
        />
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
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={bullet}
                onChange={(e) => updateBullet(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-border bg-background text-foreground rounded-lg"
                placeholder="Bullet point"
              />
              <button type="button" onClick={() => removeBullet(index)} className="text-red-500">
                <X className="h-4 w-4" />
              </button>
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
