"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, Loader2, X, Save } from "lucide-react";
import {
  createSkillGroup,
  updateSkillGroup,
  deleteSkillGroup,
  createSkill,
  updateSkill,
  deleteSkill,
  type getSkillGroups,
} from "@/app/actions/skills";
import { ItemVisibilityToggle } from "@/components/admin/item-visibility-toggle";
import { updateSkillGroupVisibility } from "@/app/actions/item-visibility";
import { TEXT_LIMITS, validateTextLength } from "@/lib/text-limits";
import { CharCounter } from "@/components/ui/char-counter";

type SkillGroup = Awaited<ReturnType<typeof getSkillGroups>>[0];

export function SkillsManager({ initialData, isReadOnly = false }: { initialData: SkillGroup[]; isReadOnly?: boolean }) {
  const [skillGroups, setSkillGroups] = useState(initialData);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<{ groupId: string; skillId: string } | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [creatingSkillGroupId, setCreatingSkillGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(skillGroups.map((g) => g.id)));

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCreateGroup = async (name: string) => {
    if (!name.trim()) return;
    setLoading("create-group");
    setError(null);
    try {
      const order = skillGroups.length;
      const newGroup = await createSkillGroup({ name: name.trim(), order });
      const groupWithSkills = { ...newGroup, skills: [] };
      setSkillGroups([...skillGroups, groupWithSkills]);
      setIsCreatingGroup(false);
      // Immediately show skill input for the new group
      setCreatingSkillGroupId(newGroup.id);
      // Expand the new group
      setExpandedGroups(new Set([...expandedGroups, newGroup.id]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create skill group");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateGroup = async (id: string, name: string, order: number) => {
    if (!name.trim()) {
      setEditingGroup(null);
      return;
    }
    setLoading(id);
    setError(null);
    try {
      await updateSkillGroup(id, { name: name.trim(), order });
      setSkillGroups(
        skillGroups.map((g) => (g.id === id ? { ...g, name: name.trim(), order } : g)).sort((a, b) => a.order - b.order),
      );
      setEditingGroup(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill group");
      setEditingGroup(null);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Delete this group and all its skills?")) return;
    setLoading(id);
    setError(null);
    try {
      await deleteSkillGroup(id);
      setSkillGroups(skillGroups.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill group");
    } finally {
      setLoading(null);
    }
  };

  const handleCreateSkill = async (groupId: string, name: string) => {
    if (!name.trim()) return;
    setLoading(`create-skill-${groupId}`);
    setError(null);
    try {
      const group = skillGroups.find((g) => g.id === groupId);
      const order = group?.skills.length || 0;
      const newSkill = await createSkill({ skillGroupId: groupId, name: name.trim(), order });
      setSkillGroups(
        skillGroups.map((g) =>
          g.id === groupId ? { ...g, skills: [...g.skills, newSkill] } : g,
        ),
      );
      setCreatingSkillGroupId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create skill");
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateSkill = async (groupId: string, skillId: string, name: string) => {
    if (!name.trim()) {
      setEditingSkill(null);
      return;
    }
    setLoading(skillId);
    setError(null);
    try {
      await updateSkill(skillId, { name: name.trim() });
      setSkillGroups(
        skillGroups.map((g) =>
          g.id === groupId
            ? { ...g, skills: g.skills.map((s) => (s.id === skillId ? { ...s, name: name.trim() } : s)) }
            : g,
        ),
      );
      setEditingSkill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill");
      setEditingSkill(null);
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteSkill = async (groupId: string, skillId: string) => {
    if (!confirm("Delete this skill?")) return;
    setLoading(skillId);
    setError(null);
    try {
      await deleteSkill(skillId);
      setSkillGroups(
        skillGroups.map((g) => (g.id === groupId ? { ...g, skills: g.skills.filter((s) => s.id !== skillId) } : g)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Skill Groups</h2>
        {!isCreatingGroup && (
          <button
            onClick={() => setIsCreatingGroup(true)}
            disabled={isReadOnly}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add Group
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isCreatingGroup && (
        <GroupForm
          onSave={(name) => handleCreateGroup(name)}
          onCancel={() => {
            setIsCreatingGroup(false);
            setError(null);
          }}
          loading={loading === "create-group"}
        />
      )}

      {skillGroups.length === 0 ? (
        <div className="border border-border bg-panel rounded-lg p-8 text-center">
          <p className="text-muted">No skill groups yet. Create your first group to get started.</p>
        </div>
      ) : (
        skillGroups.map((group) => (
          <div key={group.id} className="border border-border bg-panel rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                <button onClick={() => toggleGroup(group.id)} className="text-muted hover:text-foreground transition-colors flex-shrink-0">
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                {editingGroup === group.id ? (
                  <input
                    type="text"
                    defaultValue={group.name}
                    onBlur={(e) => handleUpdateGroup(group.id, e.target.value, group.order)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateGroup(group.id, e.currentTarget.value, group.order);
                      }
                      if (e.key === "Escape") {
                        setEditingGroup(null);
                      }
                    }}
                    className="px-2 py-1 border border-border bg-background text-foreground rounded flex-1 min-w-0"
                    autoFocus
                    disabled={loading === group.id}
                  />
                ) : (
                  <h3 className="font-semibold text-foreground break-words min-w-0" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{group.name}</h3>
                )}
                {loading === group.id && <Loader2 className="h-4 w-4 animate-spin text-muted flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <ItemVisibilityToggle
                  itemId={group.id}
                  initialValue={group.isVisible ?? true}
                  onToggle={async (id, isVisible) => {
                    await updateSkillGroupVisibility(id, isVisible);
                    setSkillGroups(skillGroups.map(g => g.id === id ? { ...g, isVisible } : g));
                  }}
                  isReadOnly={isReadOnly}
                />
                <button
                  onClick={() => setEditingGroup(group.id)}
                  className="text-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading === group.id || isReadOnly}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading === group.id || isReadOnly}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {expandedGroups.has(group.id) && (
              <div className="px-4 pb-4 space-y-2">
                {group.skills.length === 0 && creatingSkillGroupId !== group.id ? (
                  <p className="text-sm text-muted py-2">No skills in this group yet.</p>
                ) : (
                  group.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between py-2 px-3 bg-panel2 rounded gap-3 overflow-hidden">
                      {editingSkill?.groupId === group.id && editingSkill.skillId === skill.id ? (
                        <input
                          type="text"
                          defaultValue={skill.name}
                          onBlur={(e) => handleUpdateSkill(group.id, skill.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateSkill(group.id, skill.id, e.currentTarget.value);
                            }
                            if (e.key === "Escape") {
                              setEditingSkill(null);
                            }
                          }}
                          className="flex-1 px-2 py-1 border border-border bg-background text-foreground rounded min-w-0"
                          autoFocus
                          disabled={loading === skill.id}
                        />
                      ) : (
                        <span className="text-foreground break-words min-w-0 flex-1" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{skill.name}</span>
                      )}
                      {loading === skill.id && <Loader2 className="h-3 w-3 animate-spin text-muted flex-shrink-0" />}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingSkill({ groupId: group.id, skillId: skill.id })}
                          className="text-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading === skill.id || isReadOnly}
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteSkill(group.id, skill.id)}
                          className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={loading === skill.id || isReadOnly}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                {creatingSkillGroupId === group.id ? (
                  <SkillForm
                    onSave={(name) => handleCreateSkill(group.id, name)}
                    onCancel={() => {
                      setCreatingSkillGroupId(null);
                      setError(null);
                    }}
                    loading={loading === `create-skill-${group.id}`}
                  />
                ) : (
                  <button
                    onClick={() => setCreatingSkillGroupId(group.id)}
                    disabled={isReadOnly}
                    className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3 w-3" />
                    Add Skill
                  </button>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function GroupForm({
  onSave,
  onCancel,
  loading,
}: {
  onSave: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const validation = validateTextLength(name, TEXT_LIMITS.NAME, "Group name");
    if (!validation.isValid) {
      setNameError(validation.error);
      return;
    }
    
    onSave(name);
    setName("");
    setNameError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border bg-panel rounded-lg p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            maxLength={TEXT_LIMITS.NAME}
            onChange={(e) => {
              const value = e.target.value;
              setName(value);
              const validation = validateTextLength(value, TEXT_LIMITS.NAME, "Group name");
              setNameError(validation.error);
            }}
            placeholder="Group name"
            className={`flex-1 px-3 py-2 border rounded-lg ${
              nameError
                ? "border-red-500 bg-red-500/10"
                : "border-border bg-background text-foreground"
            }`}
            autoFocus
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !name.trim() || !!nameError}
            className="flex items-center gap-2 px-3 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-border bg-panel text-foreground rounded-lg hover:bg-panel2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <CharCounter current={name.length} max={TEXT_LIMITS.NAME} />
        {nameError && <p className="text-xs text-red-400">{nameError}</p>}
      </div>
    </form>
  );
}

function SkillForm({
  onSave,
  onCancel,
  loading,
}: {
  onSave: (name: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const validation = validateTextLength(name, TEXT_LIMITS.TAG, "Skill name");
    if (!validation.isValid) {
      setNameError(validation.error);
      return;
    }
    
    onSave(name);
    setName("");
    setNameError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="flex-1 space-y-1">
        <input
          type="text"
          value={name}
          maxLength={TEXT_LIMITS.TAG}
          onChange={(e) => {
            const value = e.target.value;
            setName(value);
            const validation = validateTextLength(value, TEXT_LIMITS.TAG, "Skill name");
            setNameError(validation.error);
          }}
          placeholder="Skill name"
          className={`flex-1 px-2 py-1 border rounded text-sm ${
            nameError
              ? "border-red-500 bg-red-500/10"
              : "border-border bg-background text-foreground"
          }`}
          autoFocus
          required
          disabled={loading}
        />
        <CharCounter current={name.length} max={TEXT_LIMITS.TAG} />
        {nameError && <p className="text-xs text-red-400">{nameError}</p>}
      </div>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-2 py-1 bg-accent text-foreground rounded text-sm hover:bg-blue-500 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-2 py-1 border border-border bg-panel text-foreground rounded text-sm hover:bg-panel2 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </form>
  );
}
