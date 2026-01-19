"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, X, Save } from "lucide-react";
import {
  createExperience,
  updateExperience,
  deleteExperience,
  type getExperiences,
} from "@/app/actions/experience";

type Experience = Awaited<ReturnType<typeof getExperiences>>[0];

export function ExperienceManager({ initialData }: { initialData: Experience[] }) {
  const [experiences, setExperiences] = useState(initialData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
  };

  const handleSaveNew = async (data: {
    title: string;
    company: string;
    location: string;
    period: string;
    bullets: string[];
    tech: string[];
  }) => {
    const order = experiences.length;
    await createExperience({ ...data, order });
    // Refetch experiences to get full data with relations
    window.location.reload();
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
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this experience entry?")) return;
    await deleteExperience(id);
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Experience Entries</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add Experience
        </button>
      </div>

      {isCreating && (
        <ExperienceForm
          onSave={handleSaveNew}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {experiences.map((exp) =>
        editingId === exp.id ? (
          <ExperienceForm
            key={exp.id}
            experience={exp}
            onSave={(data) => handleUpdate(exp.id, data)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={exp.id} className="border border-border bg-panel rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground mb-1">{exp.title}</h3>
                <p className="text-sm text-muted">{exp.company}</p>
                <p className="text-xs text-muted-disabled">{exp.location} • {exp.period}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingId(exp.id)}
                  className="text-muted hover:text-foreground"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-disabled mb-1">Bullets:</p>
                <ul className="text-sm text-muted space-y-1">
                  {exp.bullets.map((b) => (
                    <li key={b.id}>• {b.text}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted-disabled mb-1">Tech:</p>
                <div className="flex flex-wrap gap-2">
                  {exp.tech.map((t) => (
                    <span key={t.id} className="text-xs px-2 py-1 bg-panel2 rounded">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function ExperienceForm({
  experience,
  onSave,
  onCancel,
}: {
  experience?: Experience;
  onSave: (data: { title: string; company: string; location: string; period: string; bullets: string[]; tech: string[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(experience?.title || "");
  const [company, setCompany] = useState(experience?.company || "");
  const [location, setLocation] = useState(experience?.location || "");
  const [period, setPeriod] = useState(experience?.period || "");
  const [bullets, setBullets] = useState<string[]>(experience?.bullets.map((b) => b.text) || []);
  const [tech, setTech] = useState<string[]>(experience?.tech.map((t) => t.name) || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company) return;
    onSave({ title, company, location, period, bullets, tech });
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

  const addTech = () => {
    setTech([...tech, ""]);
  };

  const updateTech = (index: number, value: string) => {
    setTech(tech.map((t, i) => (i === index ? value : t)));
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Period</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg"
            placeholder="e.g., Current or 2020-2023"
          />
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
                onChange={(e) => updateTech(index, e.target.value)}
                className="px-2 py-1 border border-border bg-background text-foreground rounded text-sm"
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
          className="flex items-center gap-2 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-blue-500"
        >
          <Save className="h-4 w-4" />
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-border bg-panel2 text-foreground rounded-lg hover:bg-panel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
