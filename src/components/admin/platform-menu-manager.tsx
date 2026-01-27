"use client";

import { useState, useTransition, useCallback } from "react";
import { Settings, Eye, EyeOff, Edit2, Save, X, Plus } from "lucide-react";
import {
  updatePlatformMenu,
  createPlatformMenu,
  checkPlatformMenuKeyAvailable,
} from "@/app/actions/platform-menu";
import { PlatformMenu } from "@prisma/client";
import { hasSectionEditor } from "@/lib/section-types";
import {
  SECTION_TEMPLATE_OPTIONS,
  type SectionTemplate,
} from "@/lib/section-types";
import { TEXT_LIMITS } from "@/lib/text-limits";

type PlatformMenuManagerProps = {
  menus: PlatformMenu[];
};

function validateKeyLocal(key: string): string | null {
  const k = key.trim();
  if (!k) return "Menu key is required";
  if (k.length > TEXT_LIMITS.PLATFORM_MENU_KEY_MAX)
    return `Key must be ${TEXT_LIMITS.PLATFORM_MENU_KEY_MAX} characters or less`;
  if (/\s/.test(k)) return "Key cannot contain spaces";
  if (k !== k.toLowerCase()) return "Key must be lowercase";
  if (!/^[a-z0-9_-]+$/.test(k))
    return "Key must be lowercase letters, numbers, hyphens, or underscores only";
  return null;
}

function validateLabelLocal(label: string): string | null {
  const t = label.trim();
  if (!t) return "Label is required";
  if (t.length > TEXT_LIMITS.PLATFORM_MENU_LABEL)
    return `Label must be ${TEXT_LIMITS.PLATFORM_MENU_LABEL} characters or less`;
  return null;
}

export function PlatformMenuManager({ menus: initialMenus }: PlatformMenuManagerProps) {
  const [menus, setMenus] = useState(initialMenus);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSectionTemplate, setEditSectionTemplate] =
    useState<SectionTemplate>("custom_static");
  const [editErrors, setEditErrors] = useState<{
    label?: string;
    sectionTemplate?: string;
  }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMenuKey, setNewMenuKey] = useState("");
  const [newMenuLabel, setNewMenuLabel] = useState("");
  const [newMenuSectionTemplate, setNewMenuSectionTemplate] =
    useState<SectionTemplate>("custom_static");
  const [createErrors, setCreateErrors] = useState<{
    key?: string;
    label?: string;
    sectionTemplate?: string;
  }>({});
  const [keyCheckPending, setKeyCheckPending] = useState(false);
  const [isPending, startTransition] = useTransition();

  const runCreateValidation = useCallback(() => {
    const keyErr = validateKeyLocal(newMenuKey);
    const labelErr = validateLabelLocal(newMenuLabel);
    const templateErr =
      !newMenuSectionTemplate || newMenuSectionTemplate === "custom_static"
        ? "Section template is required"
        : null;
    setCreateErrors({
      key: keyErr ?? undefined,
      label: labelErr ?? undefined,
      sectionTemplate: templateErr ?? undefined,
    });
    return !keyErr && !labelErr && !templateErr;
  }, [newMenuKey, newMenuLabel, newMenuSectionTemplate]);

  const runEditValidation = useCallback(() => {
    const labelErr = validateLabelLocal(editLabel);
    const templateErr =
      !editSectionTemplate || editSectionTemplate === "custom_static"
        ? "Section template is required"
        : null;
    setEditErrors({
      label: labelErr ?? undefined,
      sectionTemplate: templateErr ?? undefined,
    });
    return !labelErr && !templateErr;
  }, [editLabel, editSectionTemplate]);

  const isCreateValid =
    !createErrors.key &&
    !createErrors.label &&
    !createErrors.sectionTemplate &&
    newMenuKey.trim() &&
    newMenuLabel.trim() &&
    newMenuSectionTemplate &&
    newMenuSectionTemplate !== "custom_static";

  const handleToggleEnabled = (menu: PlatformMenu) => {
    setListError(null);
    startTransition(async () => {
      try {
        await updatePlatformMenu(menu.id, { enabled: !menu.enabled });
        setMenus((prev) =>
          prev.map((m) => (m.id === menu.id ? { ...m, enabled: !m.enabled } : m))
        );
      } catch (err) {
        setListError(err instanceof Error ? err.message : "Failed to update menu");
      }
    });
  };

  const handleStartEdit = (menu: PlatformMenu) => {
    setEditingId(menu.id);
    setEditLabel(menu.label);
    const t =
      menu.sectionType.endsWith("_template")
        ? (menu.sectionType as SectionTemplate)
        : `${menu.sectionType}_template` as SectionTemplate;
    setEditSectionTemplate(
      SECTION_TEMPLATE_OPTIONS.some((o) => o.value === t) ? t : "custom_static"
    );
    setEditErrors({});
  };

  const handleSaveEdit = (menuId: string) => {
    if (!runEditValidation()) return;

    setListError(null);
    startTransition(async () => {
      try {
        await updatePlatformMenu(menuId, {
          label: editLabel.trim(),
          sectionType: editSectionTemplate,
        });
        setMenus((prev) =>
          prev.map((m) =>
            m.id === menuId
              ? { ...m, label: editLabel.trim(), sectionType: editSectionTemplate }
              : m
          )
        );
        setEditingId(null);
        setEditLabel("");
        setEditSectionTemplate("custom_static");
        setEditErrors({});
      } catch (err) {
        setListError(err instanceof Error ? err.message : "Failed to update menu");
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditSectionTemplate("custom_static");
    setEditErrors({});
  };

  const handleCreateMenu = () => {
    if (!runCreateValidation()) return;

    setKeyCheckPending(true);
    checkPlatformMenuKeyAvailable(newMenuKey)
      .then(({ available, error }) => {
        if (!available && error) {
          setCreateErrors((e) => ({ ...e, key: error }));
          setKeyCheckPending(false);
          return;
        }
        startTransition(async () => {
          try {
            const newMenu = await createPlatformMenu({
              key: newMenuKey.trim().toLowerCase(),
              label: newMenuLabel.trim(),
              sectionType: newMenuSectionTemplate,
              enabled: true,
            });
            setMenus((prev) => [...prev, newMenu]);
            setNewMenuKey("");
            setNewMenuLabel("");
            setNewMenuSectionTemplate("custom_static");
            setCreateErrors({});
            setShowCreateForm(false);
          } catch (err) {
            setCreateErrors((e) => ({
              ...e,
              key: err instanceof Error ? err.message : "Failed to create menu",
            }));
          } finally {
            setKeyCheckPending(false);
          }
        });
      })
      .catch(() => {
        setCreateErrors((e) => ({ ...e, key: "Could not verify key" }));
        setKeyCheckPending(false);
      });
  };

  const handleNewKeyBlur = () => {
    const err = validateKeyLocal(newMenuKey);
    setCreateErrors((e) => ({ ...e, key: err ?? undefined }));
    if (!err && newMenuKey.trim()) {
      setKeyCheckPending(true);
      checkPlatformMenuKeyAvailable(newMenuKey).then(({ available, error }) => {
        setCreateErrors((e) => ({
          ...e,
          key: available ? undefined : (error ?? "Key already in use"),
        }));
        setKeyCheckPending(false);
      });
    }
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
              Manage global menu definitions. Disabled menus won&apos;t appear in any portfolio.
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
                Menu Key (lowercase, no spaces, unique)
              </label>
              <input
                type="text"
                value={newMenuKey}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/\s/g, "");
                  setNewMenuKey(value);
                  setCreateErrors((prev) => ({ ...prev, key: validateKeyLocal(value) ?? undefined }));
                }}
                onBlur={handleNewKeyBlur}
                placeholder="e.g. certifications, blog"
                className={`w-full px-2 py-1 border rounded text-sm bg-background text-foreground ${
                  createErrors.key
                    ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    : "border-border focus:outline-none focus:ring-2 focus:ring-accent"
                }`}
                disabled={isPending || keyCheckPending}
                aria-invalid={!!createErrors.key}
                aria-describedby={createErrors.key ? "create-key-error" : undefined}
              />
              {createErrors.key && (
                <p id="create-key-error" className="mt-1 text-xs text-red-500">
                  {createErrors.key}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Label
              </label>
              <input
                type="text"
                value={newMenuLabel}
                onChange={(e) => {
                  setNewMenuLabel(e.target.value);
                  setCreateErrors((e) => ({
                    ...e,
                    label: validateLabelLocal(e.target.value) ?? undefined,
                  }));
                }}
                placeholder="e.g. Certifications"
                maxLength={TEXT_LIMITS.PLATFORM_MENU_LABEL}
                className={`w-full px-2 py-1 border rounded text-sm bg-background text-foreground ${
                  createErrors.label
                    ? "border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    : "border-border focus:outline-none focus:ring-2 focus:ring-accent"
                }`}
                disabled={isPending}
                aria-invalid={!!createErrors.label}
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>{newMenuLabel.length} / {TEXT_LIMITS.PLATFORM_MENU_LABEL}</span>
                {createErrors.label && (
                  <span className="text-red-500">{createErrors.label}</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Section Template (required)
              </label>
              <select
                value={newMenuSectionTemplate}
                onChange={(e) => {
                  const v = e.target.value as SectionTemplate;
                  setNewMenuSectionTemplate(v);
                  setCreateErrors((e) => ({
                    ...e,
                    sectionTemplate:
                      !v || v === "custom_static"
                        ? "Section template is required"
                        : undefined,
                  }));
                }}
                className={`w-full px-2 py-1 border rounded text-sm bg-background text-foreground ${
                  createErrors.sectionTemplate
                    ? "border-red-500"
                    : "border-border"
                }`}
                disabled={isPending}
                aria-invalid={!!createErrors.sectionTemplate}
              >
                {SECTION_TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} {!option.hasEditor && "(No Editor)"}
                  </option>
                ))}
              </select>
              {createErrors.sectionTemplate && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.sectionTemplate}
                </p>
              )}
              <p className="mt-1 text-xs text-muted">
                {hasSectionEditor(newMenuSectionTemplate)
                  ? "This template has an admin editor"
                  : "This template has no editor yet"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateMenu}
                disabled={
                  isPending ||
                  keyCheckPending ||
                  !isCreateValid
                }
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
                  setCreateErrors({});
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

      {listError && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-sm text-red-500">
          {listError}
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
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted">Key (read-only)</span>
                      <div className="mt-0.5">
                        <code className="text-xs bg-panel2 px-1.5 py-0.5 rounded">
                          {menu.key}
                        </code>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground">
                        Label
                      </label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => {
                          setEditLabel(e.target.value);
                          setEditErrors((e) => ({
                            ...e,
                            label: validateLabelLocal(e.target.value) ?? undefined,
                          }));
                        }}
                        maxLength={TEXT_LIMITS.PLATFORM_MENU_LABEL}
                        className={`w-full px-2 py-1 border rounded text-sm bg-background text-foreground ${
                          editErrors.label ? "border-red-500" : "border-border"
                        }`}
                        aria-invalid={!!editErrors.label}
                      />
                      {editErrors.label && (
                        <p className="mt-1 text-xs text-red-500">{editErrors.label}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground">
                        Section Template
                      </label>
                      <select
                        value={editSectionTemplate}
                        onChange={(e) => {
                          const v = e.target.value as SectionTemplate;
                          setEditSectionTemplate(v);
                          setEditErrors((e) => ({
                            ...e,
                            sectionTemplate:
                              !v || v === "custom_static"
                                ? "Section template is required"
                                : undefined,
                          }));
                        }}
                        className={`w-full px-2 py-1 border rounded text-sm bg-background text-foreground ${
                          editErrors.sectionTemplate ? "border-red-500" : "border-border"
                        }`}
                        aria-invalid={!!editErrors.sectionTemplate}
                      >
                        {SECTION_TEMPLATE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label} {!option.hasEditor && "(No Editor)"}
                          </option>
                        ))}
                      </select>
                      {editErrors.sectionTemplate && (
                        <p className="mt-1 text-xs text-red-500">
                          {editErrors.sectionTemplate}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs text-muted bg-panel2 px-1.5 py-0.5 rounded">
                        {menu.key}
                      </code>
                      <span className="text-sm font-medium text-foreground">
                        {menu.label}
                      </span>
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

              <div className="flex items-center gap-2 flex-shrink-0">
                {editingId === menu.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(menu.id)}
                      disabled={
                        isPending ||
                        !!editErrors.label ||
                        !!editErrors.sectionTemplate ||
                        !editLabel.trim() ||
                        !editSectionTemplate ||
                        editSectionTemplate === "custom_static"
                      }
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
                      title="Edit"
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
