"use client";

import { useState, useTransition } from "react";
import { Settings, Eye, EyeOff, Edit2, Save, X, Plus } from "lucide-react";
import { updatePlatformMenu, createPlatformMenu } from "@/app/actions/platform-menu";
import { PlatformMenu } from "@prisma/client";
import { hasSectionEditor } from "@/lib/section-types";
import type { SectionType } from "@/lib/section-types";

type PlatformMenuManagerProps = {
  menus: PlatformMenu[];
};

const SECTION_TYPE_OPTIONS: Array<{ value: SectionType; label: string; hasEditor: boolean }> = [
  { value: "about", label: "About", hasEditor: true },
  { value: "skills", label: "Skills", hasEditor: true },
  { value: "projects", label: "Projects", hasEditor: true },
  { value: "experience", label: "Experience", hasEditor: true },
  { value: "architecture", label: "Architecture", hasEditor: true },
  { value: "contact", label: "Contact", hasEditor: true },
  { value: "custom_static", label: "Custom Static (No Editor)", hasEditor: false },
];

export function PlatformMenuManager({ menus: initialMenus }: PlatformMenuManagerProps) {
  const [menus, setMenus] = useState(initialMenus);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMenuKey, setNewMenuKey] = useState("");
  const [newMenuLabel, setNewMenuLabel] = useState("");
  const [newMenuSectionType, setNewMenuSectionType] = useState<SectionType>("custom_static");
  const [isPending, startTransition] = useTransition();

  const handleToggleEnabled = (menu: PlatformMenu) => {
    startTransition(async () => {
      try {
        await updatePlatformMenu(menu.id, { enabled: !menu.enabled });
        setMenus((prev) =>
          prev.map((m) => (m.id === menu.id ? { ...m, enabled: !m.enabled } : m))
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update menu");
      }
    });
  };

  const handleStartEdit = (menu: PlatformMenu) => {
    setEditingId(menu.id);
    setEditLabel(menu.label);
  };

  const handleSaveEdit = (menuId: string) => {
    if (!editLabel.trim()) {
      alert("Label cannot be empty");
      return;
    }

    startTransition(async () => {
      try {
        await updatePlatformMenu(menuId, { label: editLabel.trim() });
        setMenus((prev) =>
          prev.map((m) => (m.id === menuId ? { ...m, label: editLabel.trim() } : m))
        );
        setEditingId(null);
        setEditLabel("");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update menu");
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
  };

  const handleCreateMenu = () => {
    if (!newMenuKey.trim() || !newMenuLabel.trim() || !newMenuSectionType) {
      alert("Key, label, and section type are required");
      return;
    }

    // Validate key format (lowercase, alphanumeric, underscores, hyphens)
    if (!/^[a-z0-9_-]+$/.test(newMenuKey.trim())) {
      alert("Key must be lowercase alphanumeric with underscores or hyphens only");
      return;
    }

    startTransition(async () => {
      try {
        const newMenu = await createPlatformMenu({
          key: newMenuKey.trim(),
          label: newMenuLabel.trim(),
          sectionType: newMenuSectionType,
          enabled: true,
        });
        setMenus((prev) => [...prev, newMenu]);
        setNewMenuKey("");
        setNewMenuLabel("");
        setNewMenuSectionType("custom_static");
        setShowCreateForm(false);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to create menu");
      }
    });
  };

  return (
    <div className="border border-border bg-panel rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Menus
            </h2>
            <p className="text-sm text-muted mt-1">
              Manage global menu definitions. Disabled menus won't appear in any portfolio.
            </p>
          </div>
          {!showCreateForm && (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="px-3 py-1.5 text-sm bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Menu
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="p-4 border-b border-border bg-panel2">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Menu Key (lowercase, alphanumeric, underscores/hyphens)
              </label>
              <input
                type="text"
                value={newMenuKey}
                onChange={(e) => setNewMenuKey(e.target.value.toLowerCase())}
                placeholder="e.g., blog, testimonials"
                className="w-full px-2 py-1 border border-border bg-background text-foreground rounded text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Menu Label
              </label>
              <input
                type="text"
                value={newMenuLabel}
                onChange={(e) => setNewMenuLabel(e.target.value)}
                placeholder="e.g., Blog, Testimonials"
                className="w-full px-2 py-1 border border-border bg-background text-foreground rounded text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Section Type (required)
              </label>
              <select
                value={newMenuSectionType}
                onChange={(e) => setNewMenuSectionType(e.target.value as SectionType)}
                className="w-full px-2 py-1 border border-border bg-background text-foreground rounded text-sm"
                disabled={isPending}
              >
                {SECTION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} {!option.hasEditor && "(No Editor)"}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                {hasSectionEditor(newMenuSectionType)
                  ? "This section type has an admin editor"
                  : "This section type has no editor yet"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateMenu}
                disabled={isPending || !newMenuKey.trim() || !newMenuLabel.trim() || !newMenuSectionType}
                className="px-3 py-1.5 text-sm bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewMenuKey("");
                  setNewMenuLabel("");
                }}
                disabled={isPending}
                className="px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded-lg hover:bg-panel2 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="divide-y divide-border">
        {menus.length === 0 ? (
          <div className="px-4 py-6 text-center text-muted text-sm">
            No menus configured
          </div>
        ) : (
          menus.map((menu) => (
            <div
              key={menu.id}
              className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-panel2/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                {editingId === menu.id ? (
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full px-2 py-1 border border-border bg-background text-foreground rounded text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveEdit(menu.id);
                      } else if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                  />
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted bg-panel2 px-1.5 py-0.5 rounded">
                        {menu.key}
                      </code>
                      <span className="text-sm font-medium text-foreground">{menu.label}</span>
                      <span className="text-xs text-muted bg-panel2 px-1.5 py-0.5 rounded">
                        {menu.sectionType}
                      </span>
                      {!hasSectionEditor(menu.sectionType) && (
                        <span className="text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                          No Editor
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingId === menu.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(menu.id)}
                      disabled={isPending}
                      className="p-1.5 text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isPending}
                      className="p-1.5 text-muted hover:bg-panel2 rounded transition-colors disabled:opacity-50"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(menu)}
                      disabled={isPending}
                      className="p-1.5 text-muted hover:bg-panel2 rounded transition-colors disabled:opacity-50"
                      title="Edit label"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(menu)}
                      disabled={isPending}
                      className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                        menu.enabled
                          ? "text-green-400 hover:bg-green-500/10"
                          : "text-muted hover:bg-panel2"
                      }`}
                      title={menu.enabled ? "Disable menu" : "Enable menu"}
                    >
                      {menu.enabled ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
