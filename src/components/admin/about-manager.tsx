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

export function AboutManager({ initialData }: { initialData: AboutContent | null }) {
  const [aboutContent, setAboutContent] = useState(initialData);
  const [editingContent, setEditingContent] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<string | null>(null);
  const [isCreatingPrinciple, setIsCreatingPrinciple] = useState(false);

  const handleUpdateContent = async (data: { title: string; paragraphs: string[] }) => {
    if (!aboutContent) return;
    await updateAboutContent(data);
    setAboutContent({ ...aboutContent, title: data.title, paragraphs: JSON.stringify(data.paragraphs) });
    setEditingContent(false);
    window.location.reload();
  };

  const handleCreatePrinciple = async () => {
    if (!aboutContent) return;
    setIsCreatingPrinciple(true);
  };

  const handleSaveNewPrinciple = async (data: { title: string; description: string }) => {
    if (!aboutContent) return;
    const order = aboutContent.principles.length;
    await createPrinciple({
      aboutContentId: aboutContent.id,
      ...data,
      order,
    });
    window.location.reload();
  };

  const handleUpdatePrinciple = async (
    id: string,
    data: { title: string; description: string; order: number }
  ) => {
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
  };

  const handleDeletePrinciple = async (id: string) => {
    if (!confirm("Delete this principle?")) return;
    await deletePrinciple(id);
    setAboutContent(
      aboutContent
        ? {
            ...aboutContent,
            principles: aboutContent.principles.filter((p) => p.id !== id),
          }
        : null
    );
  };

  if (!aboutContent) {
    return <div className="text-muted">No about content found. Please create one.</div>;
  }

  return (
    <div className="space-y-6">
      {/* About Content */}
      <div className="border border-border bg-panel rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">About Content</h2>
          {!editingContent && (
            <button
              onClick={() => setEditingContent(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-panel2 text-foreground rounded-lg hover:bg-panel"
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
          {!isCreatingPrinciple && (
            <button
              onClick={handleCreatePrinciple}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500"
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
          {aboutContent.principles.map((principle) => (
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPrinciple(principle.id)}
                      className="p-2 text-muted hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePrinciple(principle.id)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
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
