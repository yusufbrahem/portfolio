"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import {
  createSkillGroup,
  updateSkillGroup,
  deleteSkillGroup,
  createSkill,
  updateSkill,
  deleteSkill,
  type getSkillGroups,
} from "@/app/actions/skills";

type SkillGroup = Awaited<ReturnType<typeof getSkillGroups>>[0];

export function SkillsManager({ initialData }: { initialData: SkillGroup[] }) {
  const [skillGroups, setSkillGroups] = useState(initialData);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<{ groupId: string; skillId: string } | null>(null);
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

  const handleCreateGroup = async () => {
    const name = prompt("Group name:");
    if (!name) return;
    const order = skillGroups.length;
    const newGroup = await createSkillGroup({ name, order });
    setSkillGroups([...skillGroups, { ...newGroup, skills: [] }]);
  };

  const handleUpdateGroup = async (id: string, name: string, order: number) => {
    await updateSkillGroup(id, { name, order });
    setSkillGroups(
      skillGroups.map((g) => (g.id === id ? { ...g, name, order } : g)).sort((a, b) => a.order - b.order),
    );
    setEditingGroup(null);
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Delete this group and all its skills?")) return;
    await deleteSkillGroup(id);
    setSkillGroups(skillGroups.filter((g) => g.id !== id));
  };

  const handleCreateSkill = async (groupId: string) => {
    const name = prompt("Skill name:");
    if (!name) return;
    const group = skillGroups.find((g) => g.id === groupId);
    const order = group?.skills.length || 0;
    const newSkill = await createSkill({ skillGroupId: groupId, name, order });
    setSkillGroups(
      skillGroups.map((g) =>
        g.id === groupId ? { ...g, skills: [...g.skills, newSkill] } : g,
      ),
    );
  };

  const handleUpdateSkill = async (groupId: string, skillId: string, name: string) => {
    await updateSkill(skillId, { name });
    setSkillGroups(
      skillGroups.map((g) =>
        g.id === groupId
          ? { ...g, skills: g.skills.map((s) => (s.id === skillId ? { ...s, name } : s)) }
          : g,
      ),
    );
    setEditingSkill(null);
  };

  const handleDeleteSkill = async (groupId: string, skillId: string) => {
    if (!confirm("Delete this skill?")) return;
    await deleteSkill(skillId);
    setSkillGroups(
      skillGroups.map((g) => (g.id === groupId ? { ...g, skills: g.skills.filter((s) => s.id !== skillId) } : g)),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Skill Groups</h2>
        <button
          onClick={handleCreateGroup}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </div>

      {skillGroups.map((group) => (
        <div key={group.id} className="border border-border bg-panel rounded-lg">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 flex-1">
              <button onClick={() => toggleGroup(group.id)} className="text-muted hover:text-foreground">
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
                  className="px-2 py-1 border border-border bg-background text-foreground rounded"
                  autoFocus
                />
              ) : (
                <h3 className="font-semibold text-foreground">{group.name}</h3>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingGroup(group.id)}
                className="text-muted hover:text-foreground"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => handleDeleteGroup(group.id)} className="text-red-500 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {expandedGroups.has(group.id) && (
            <div className="px-4 pb-4 space-y-2">
              {group.skills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between py-2 px-3 bg-panel2 rounded">
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
                      className="flex-1 px-2 py-1 border border-border bg-background text-foreground rounded"
                      autoFocus
                    />
                  ) : (
                    <span className="text-foreground">{skill.name}</span>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingSkill({ groupId: group.id, skillId: skill.id })}
                      className="text-muted hover:text-foreground"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(group.id, skill.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => handleCreateSkill(group.id)}
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground"
              >
                <Plus className="h-3 w-3" />
                Add Skill
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
