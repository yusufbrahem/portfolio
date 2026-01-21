"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X, Save } from "lucide-react";
import {
  updateAboutContent,
  createPrinciple,
  updatePrinciple,
  deletePrinciple,
  type getAboutContent,
} from "@/app/actions/about";

type AboutContent = Awaited<ReturnType<typeof getAboutContent>>;

export function AboutManager({ initialData, isReadOnly = false }: { initialData: AboutContent | null; isReadOnly?: boolean }) {
  const [aboutContent, setAboutContent] = useState(initialData);
  const [editingContent, setEditingContent] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<string | null>(null);
  const [isCreatingPrinciple, setIsCreatingPrinciple] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateContent = async (data: { title: string; paragraphs: string[] }) => {
    if (!aboutContent) return;
    setError(null);
    try {
      await updateAboutContent(data);
      setAboutContent({ ...aboutContent, title: data.title, paragraphs: JSON.stringify(data.paragraphs) });
      setEditingContent(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update about content");
    }
  };

  const handleCreatePrinciple = async () => {
    if (!aboutContent) return;
    setIsCreatingPrinciple(true);
  };

  const handleSaveNewPrinciple = async (data: { title: string; description: string }) => {
    if (!aboutContent) return;
    setError(null);
    try {
      const order = aboutContent.principles.length;
      const newPrinciple = await createPrinciple({
        aboutContentId: aboutContent.id,
        ...data,
        order,
      });
      setAboutContent({
        ...aboutContent,
        principles: [...aboutContent.principles, newPrinciple],
      });
      setIsCreatingPrinciple(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create principle");
    }
  };

  const handleUpdatePrinciple = async (
    id: string,
    data: { title: string; description: string; order: number }
  ) => {
    setError(null);
    try {
      await updatePrinciple(id, data);
      setAboutContent(
        aboutContent
          ? {
              ...aboutContent,
              principles: aboutContent.principles.map((p) =>
                p.id === id ? { ...p, ...data } : p
              ),
            }
          : null
      );
      setEditingPrinciple(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update principle");
    }
  };

  const handleDeletePrinciple = async (id: string) => {
    if (!confirm("Delete this principle?")) return;
    setError(null);
    try {
      await deletePrinciple(id);
      setAboutContent(
        aboutContent
          ? {
              ...aboutContent,
              principles: aboutContent.principles.filter((p) => p.id !== id),
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete principle");
    }
  };

  if (!aboutContent) {
    return (
      <div className="border border-border bg-panel rounded-lg p-6">
        <p className="text-sm text-muted">No about content yet.</p>
        {!isReadOnly && (
          <button
            onClick={() => {
              // Create a local draft; updateAboutContent() will create via upsert.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setAboutContent({ id: "", title: "", paragraphs: "[]", principles: [] } as any);
              setEditingContent(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create section
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* About Content */}
      <div className="border border-border bg-panel rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">About Content</h2>
          {!editingContent && !isReadOnly && (
            <button
              onClick={() => setEditingContent(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel2 text-foreground rounded-lg hover:bg-panel transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {editingContent ? (
          <AboutContentForm
            initialData={{
              title: aboutContent.title,
              paragraphs: JSON.parse(aboutContent.paragraphs || "[]"),
            }}
            onSave={handleUpdateContent}
            onCancel={() => setEditingContent(false)}
          />
        ) : (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">{aboutContent.title}</h3>
            <div className="text-muted space-y-1">
              {JSON.parse(aboutContent.paragraphs || "[]").map((p: string, i: number) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Principles */}
      <div className="border border-border bg-panel rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Principles</h2>
          {!isCreatingPrinciple && !isReadOnly && (
            <button
              onClick={handleCreatePrinciple}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Principle
            </button>
          )}
        </div>

        {isCreatingPrinciple && (
          <PrincipleForm
            onSave={handleSaveNewPrinciple}
            onCancel={() => setIsCreatingPrinciple(false)}
          />
        )}

        <div className="space-y-4 mt-4">
          {aboutContent.principles.length === 0 && !isCreatingPrinciple ? (
            <p className="text-sm text-muted text-center py-4">No principles yet. Add your first principle to get started.</p>
          ) : (
            aboutContent.principles.map((principle) => (
            <div key={principle.id} className="border border-border bg-background rounded-lg p-4">
              {editingPrinciple === principle.id ? (
                <PrincipleForm
                  initialData={{
                    title: principle.title,
                    description: principle.description,
                    order: principle.order,
                  }}
                  onSave={(data) =>
                    handleUpdatePrinciple(principle.id, {
                      ...data,
                      order: principle.order,
                    })
                  }
                  onCancel={() => setEditingPrinciple(null)}
                />
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{principle.title}</h4>
                    <p className="text-sm text-muted">{principle.description}</p>
                  </div>
                  {!isReadOnly && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPrinciple(principle.id)}
                        className="p-2 text-muted hover:text-foreground transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePrinciple(principle.id)}
                        className="p-2 text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}

function AboutContentForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: { title: string; paragraphs: string[] };
  onSave: (data: { title: string; paragraphs: string[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData.title);
  const [paragraphs, setParagraphs] = useState(initialData.paragraphs.join("\n\n"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      paragraphs: paragraphs.split("\n\n").filter((p) => p.trim()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Paragraphs (separate with blank lines)
        </label>
        <textarea
          value={paragraphs}
          onChange={(e) => setParagraphs(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-border bg-panel text-foreground rounded-lg hover:bg-panel2"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function PrincipleForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: { title: string; description: string; order?: number };
  onSave: (data: { title: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, description });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border bg-background rounded-lg">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 border border-border bg-panel text-foreground rounded-lg hover:bg-panel2"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}
