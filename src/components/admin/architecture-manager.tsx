"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X, Save, ChevronDown, ChevronUp } from "lucide-react";
import {
  createPillar,
  updatePillar,
  deletePillar,
  createPoint,
  updatePoint,
  deletePoint,
  type getArchitectureContent,
} from "@/app/actions/architecture";

type ArchitectureContent = Awaited<ReturnType<typeof getArchitectureContent>>;

export function ArchitectureManager({ initialData, isReadOnly = false }: { initialData: ArchitectureContent | null; isReadOnly?: boolean }) {
  const [architecture, setArchitecture] = useState(initialData);
  const [editingPillar, setEditingPillar] = useState<string | null>(null);
  const [editingPoint, setEditingPoint] = useState<{ pillarId: string; pointId: string } | null>(null);
  const [isCreatingPillar, setIsCreatingPillar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(
    new Set(architecture?.pillars.map((p) => p.id) || [])
  );

  const togglePillar = (pillarId: string) => {
    const newExpanded = new Set(expandedPillars);
    if (newExpanded.has(pillarId)) {
      newExpanded.delete(pillarId);
    } else {
      newExpanded.add(pillarId);
    }
    setExpandedPillars(newExpanded);
  };

  const handleCreatePillar = async () => {
    setIsCreatingPillar(true);
  };

  const handleSaveNewPillar = async (data: { title: string }) => {
    if (!architecture) return;
    setError(null);
    try {
      const order = architecture.pillars.length;
      const newPillar = await createPillar({
        architectureContentId: architecture.id,
        ...data,
        order,
      });
      const pillarWithPoints = { ...newPillar, points: [] };
      setArchitecture({
        ...architecture,
        pillars: [...architecture.pillars, pillarWithPoints],
      });
      setIsCreatingPillar(false);
      // Immediately expand the new pillar and show "Add Point" option
      setExpandedPillars(new Set([...expandedPillars, newPillar.id]));
      // Automatically trigger "Add Point" for the new pillar
      setEditingPoint({ pillarId: newPillar.id, pointId: "new" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pillar");
    }
  };

  const handleUpdatePillar = async (id: string, data: { title: string; order: number }) => {
    setError(null);
    try {
      await updatePillar(id, data);
      setArchitecture(
        architecture
          ? {
              ...architecture,
              pillars: architecture.pillars.map((p) => (p.id === id ? { ...p, ...data } : p)),
            }
          : null
      );
      setEditingPillar(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pillar");
    }
  };

  const handleDeletePillar = async (id: string) => {
    if (!confirm("Delete this pillar and all its points?")) return;
    setError(null);
    try {
      await deletePillar(id);
      setArchitecture(
        architecture
          ? {
              ...architecture,
              pillars: architecture.pillars.filter((p) => p.id !== id),
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pillar");
    }
  };

  const handleCreatePoint = async (pillarId: string) => {
    setEditingPoint({ pillarId, pointId: "new" });
  };

  const handleSaveNewPoint = async (pillarId: string, data: { text: string }) => {
    const pillar = architecture?.pillars.find((p) => p.id === pillarId);
    if (!pillar) return;
    setError(null);
    try {
      const order = pillar.points.length;
      const newPoint = await createPoint({
        architecturePillarId: pillarId,
        ...data,
        order,
      });
      setArchitecture(
        architecture
          ? {
              ...architecture,
              pillars: architecture.pillars.map((p) =>
                p.id === pillarId ? { ...p, points: [...p.points, newPoint] } : p
              ),
            }
          : null
      );
      setEditingPoint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create point");
    }
  };

  const handleUpdatePoint = async (
    pillarId: string,
    pointId: string,
    data: { text: string; order: number }
  ) => {
    setError(null);
    try {
      await updatePoint(pointId, data);
      setArchitecture(
        architecture
          ? {
              ...architecture,
              pillars: architecture.pillars.map((p) =>
                p.id === pillarId
                  ? {
                      ...p,
                      points: p.points.map((pt) => (pt.id === pointId ? { ...pt, ...data } : pt)),
                    }
                  : p
              ),
            }
          : null
      );
      setEditingPoint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update point");
    }
  };

  const handleDeletePoint = async (pillarId: string, pointId: string) => {
    if (!confirm("Delete this point?")) return;
    setError(null);
    try {
      await deletePoint(pointId);
      setArchitecture(
        architecture
          ? {
              ...architecture,
              pillars: architecture.pillars.map((p) =>
                p.id === pillarId ? { ...p, points: p.points.filter((pt) => pt.id !== pointId) } : p
              ),
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete point");
    }
  };

  if (!architecture) {
    return <div className="text-muted">No architecture content found.</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Architecture Pillars</h2>
        {!isCreatingPillar && (
          <button
            onClick={handleCreatePillar}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add Pillar
          </button>
        )}
      </div>

      {isCreatingPillar && (
        <PillarForm
          onSave={handleSaveNewPillar}
          onCancel={() => setIsCreatingPillar(false)}
        />
      )}

      {architecture.pillars.length === 0 && !isCreatingPillar ? (
        <div className="border border-border bg-panel rounded-lg p-8 text-center">
          <p className="text-muted">No architecture pillars yet. Create your first pillar to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {architecture.pillars.map((pillar) => (
            <div key={pillar.id} className="border border-border bg-panel rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              {editingPillar === pillar.id ? (
                <PillarForm
                  initialData={{ title: pillar.title, order: pillar.order }}
                  onSave={(data) => handleUpdatePillar(pillar.id, { ...data, order: pillar.order })}
                  onCancel={() => setEditingPillar(null)}
                />
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => togglePillar(pillar.id)}
                      className="p-1 text-muted hover:text-foreground transition-colors"
                    >
                      {expandedPillars.has(pillar.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                    </button>
                    <h3 className="font-semibold text-foreground">{pillar.title}</h3>
                    <span className="text-xs text-muted">({pillar.points.length} points)</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingPillar(pillar.id)}
                      disabled={isReadOnly}
                      className="p-2 text-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePillar(pillar.id)}
                      disabled={isReadOnly}
                      className="p-2 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {expandedPillars.has(pillar.id) && editingPillar !== pillar.id && (
              <div className="mt-4 space-y-2 pl-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-foreground">Points</h4>
                  {editingPoint?.pillarId !== pillar.id && (
                    <button
                      onClick={() => handleCreatePoint(pillar.id)}
                      disabled={isReadOnly}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-panel2 text-foreground rounded hover:bg-panel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-3 w-3" />
                      Add Point
                    </button>
                  )}
                </div>

                {editingPoint?.pillarId === pillar.id && editingPoint.pointId === "new" && (
                  <PointForm
                    onSave={(data) => handleSaveNewPoint(pillar.id, data)}
                    onCancel={() => setEditingPoint(null)}
                  />
                )}

                {pillar.points.length === 0 && editingPoint?.pillarId !== pillar.id ? (
                  <p className="text-xs text-muted py-2">No points yet. Add your first point.</p>
                ) : (
                  pillar.points.map((point) => (
                    <div key={point.id} className="flex justify-between items-start p-2 bg-background rounded">
                    {editingPoint?.pillarId === pillar.id && editingPoint.pointId === point.id ? (
                      <PointForm
                        initialData={{ text: point.text, order: point.order }}
                        onSave={(data) => handleUpdatePoint(pillar.id, point.id, { ...data, order: point.order })}
                        onCancel={() => setEditingPoint(null)}
                      />
                    ) : (
                      <>
                        <p className="text-sm text-muted flex-1">{point.text}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPoint({ pillarId: pillar.id, pointId: point.id })}
                            disabled={isReadOnly}
                            className="p-1 text-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeletePoint(pillar.id, point.id)}
                            disabled={isReadOnly}
                            className="p-1 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}
                    </div>
                  ))
                )}
              </div>
            )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PillarForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: { title: string; order?: number };
  onSave: (data: { title: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title });
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg"
        placeholder="Pillar title"
        required
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors"
        >
          <Save className="h-3 w-3" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border bg-panel text-foreground rounded-lg hover:bg-panel2 transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function PointForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: { text: string; order?: number };
  onSave: (data: { text: string }) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initialData?.text || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ text });
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 space-y-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded"
        placeholder="Point text"
        required
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex items-center gap-1 px-2 py-1 text-xs bg-accent text-foreground rounded hover:bg-blue-500 transition-colors"
        >
          <Save className="h-3 w-3" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-2 py-1 text-xs border border-border bg-panel text-foreground rounded hover:bg-panel2 transition-colors"
        >
          <X className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </form>
  );
}
