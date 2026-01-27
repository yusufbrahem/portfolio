"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, Eye, EyeOff, Edit2, Save, X, Plus, Trash2, GripVertical, ChevronUp, ChevronDown, RotateCcw, UnfoldHorizontal } from "lucide-react";
import {
  updatePlatformMenu,
  createPlatformMenu,
  checkPlatformMenuKeyAvailable,
  deletePlatformMenu,
  restoreDefaultMenuComponents,
  recoverHiddenMenuBlocks,
} from "@/app/actions/platform-menu";
import { PlatformMenu } from "@prisma/client";
import { UI_COMPONENT_REGISTRY, getUIComponentDef, type UIComponentKey } from "@/lib/ui-components";
import { TEXT_LIMITS } from "@/lib/text-limits";
import { DEFAULT_MENU_COMPONENT_KEYS } from "@/lib/default-menu-components";

const PROTECTED_MENU_KEYS = new Set(Object.keys(DEFAULT_MENU_COMPONENT_KEYS));

type PlatformMenuManagerProps = {
  menus: PlatformMenu[];
};

function parseComponentKeys(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((k): k is string => typeof k === "string");
}

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
  const [editOrder, setEditOrder] = useState(0);
  const [editComponentKeys, setEditComponentKeys] = useState<string[]>([]);
  const [editErrors, setEditErrors] = useState<{ label?: string; components?: string }>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMenuKey, setNewMenuKey] = useState("");
  const [newMenuLabel, setNewMenuLabel] = useState("");
  const [newMenuOrder, setNewMenuOrder] = useState(0);
  const [newMenuComponentKeys, setNewMenuComponentKeys] = useState<string[]>([]);
  const [createErrors, setCreateErrors] = useState<{ key?: string; label?: string; components?: string }>({});
  const [keyCheckPending, setKeyCheckPending] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const runCreateValidation = useCallback(() => {
    const keyErr = validateKeyLocal(newMenuKey);
    const labelErr = validateLabelLocal(newMenuLabel);
    const compErr = newMenuComponentKeys.length === 0 ? "Select at least one UI component" : undefined;
    setCreateErrors({
      key: keyErr ?? undefined,
      label: labelErr ?? undefined,
      components: compErr,
    });
    return !keyErr && !labelErr && !compErr;
  }, [newMenuKey, newMenuLabel, newMenuComponentKeys.length]);

  const runEditValidation = useCallback(() => {
    const labelErr = validateLabelLocal(editLabel);
    const compErr = editComponentKeys.length === 0 ? "At least one UI component is required" : undefined;
    setEditErrors({ label: labelErr ?? undefined, components: compErr });
    return !labelErr && !compErr;
  }, [editLabel, editComponentKeys.length]);

  const isCreateValid =
    !createErrors.key &&
    !createErrors.label &&
    !createErrors.components &&
    newMenuKey.trim() &&
    newMenuLabel.trim() &&
    newMenuComponentKeys.length > 0;

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

  const handleDeleteMenu = (menu: PlatformMenu) => {
    const confirmed = window.confirm(
      `Delete platform menu "${menu.label}" (key: ${menu.key})? This will remove the menu from all portfolios. Menu entries and block content will be removed.`
    );
    if (!confirmed) return;
    setListError(null);
    startTransition(async () => {
      try {
        await deletePlatformMenu(menu.id);
        setMenus((prev) => prev.filter((m) => m.id !== menu.id));
      } catch (err) {
        setListError(err instanceof Error ? err.message : "Failed to delete menu");
      }
    });
  };

  const handleStartEdit = (menu: PlatformMenu) => {
    setEditingId(menu.id);
    setEditLabel(menu.label);
    setEditOrder(menu.order);
    setEditComponentKeys(parseComponentKeys(menu.componentKeys));
    setEditErrors({});
  };

  const handleSaveEdit = (menuId: string) => {
    const labelErr = validateLabelLocal(editLabel);
    setEditErrors((e) => ({ ...e, label: labelErr ?? undefined }));
    if (labelErr) return;
    setListError(null);
    const menu = menus.find((m) => m.id === menuId);
    const isProtected = menu && PROTECTED_MENU_KEYS.has(menu.key);
    startTransition(async () => {
      try {
        await updatePlatformMenu(menuId, {
          label: editLabel.trim(),
          order: editOrder,
          ...(!isProtected && editComponentKeys.length > 0 ? { componentKeys: editComponentKeys } : {}),
        });
        setMenus((prev) =>
          prev.map((m) =>
            m.id === menuId
              ? { ...m, label: editLabel.trim(), order: editOrder, componentKeys: editComponentKeys }
              : m
          )
        );
        setEditingId(null);
        setEditLabel("");
        setEditOrder(0);
        setEditComponentKeys([]);
        setEditErrors({});
      } catch (err) {
        setListError(err instanceof Error ? err.message : "Failed to update menu");
      }
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditOrder(0);
    setEditComponentKeys([]);
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
              componentKeys: newMenuComponentKeys,
              order: newMenuOrder,
              enabled: true,
            });
            setMenus((prev) => [...prev, newMenu]);
            setNewMenuKey("");
            setNewMenuLabel("");
            setNewMenuOrder(0);
            setNewMenuComponentKeys([]);
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

  const addComponent = (keys: string[], setKeys: (s: string[]) => void, key: UIComponentKey) => {
    if (keys.includes(key)) return;
    setKeys([...keys, key]);
  };
  const removeComponent = (keys: string[], setKeys: (s: string[]) => void, index: number) => {
    setKeys(keys.filter((_, i) => i !== index));
  };
  const moveComponent = (keys: string[], setKeys: (s: string[]) => void, index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= keys.length) return;
    const copy = [...keys];
    [copy[index], copy[next]] = [copy[next], copy[index]];
    setKeys(copy);
  };

  const ComponentListEditor = ({
    keys,
    onChange,
    error,
    disabled,
  }: {
    keys: string[];
    onChange: (k: string[]) => void;
    error?: string;
    disabled?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        UI components (orderable)
      </label>
      <div className="space-y-1 border border-border rounded bg-background divide-y divide-border">
        {keys.map((key, idx) => {
          const def = getUIComponentDef(key);
          return (
            <div
              key={`${key}-${idx}`}
              className="flex items-center gap-2 px-2 py-1.5 text-sm"
            >
              <GripVertical className="h-4 w-4 text-muted flex-shrink-0" aria-hidden />
              <span className="flex-1 min-w-0">{def?.label ?? key}</span>
              <button
                type="button"
                onClick={() => moveComponent(keys, onChange, idx, -1)}
                disabled={disabled || idx === 0}
                className="p-0.5 text-muted hover:text-foreground disabled:opacity-40"
                title="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveComponent(keys, onChange, idx, 1)}
                disabled={disabled || idx === keys.length - 1}
                className="p-0.5 text-muted hover:text-foreground disabled:opacity-40"
                title="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeComponent(keys, onChange, idx)}
                disabled={disabled}
                className="p-0.5 text-red-500 hover:bg-red-500/10 rounded"
                title="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      {keys.length < UI_COMPONENT_REGISTRY.length && (
        <select
          className="mt-2 w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground"
          value=""
          onChange={(e) => {
            const v = e.target.value as UIComponentKey;
            if (v) addComponent(keys, onChange, v);
            e.target.value = "";
          }}
          disabled={disabled}
          aria-label="Add UI component"
        >
          <option value="">Add component...</option>
          {UI_COMPONENT_REGISTRY.filter((c) => !keys.includes(c.key)).map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );

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
              Menus are pages composed of UI components. Set key, label, order, and which components each menu contains.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!showCreateForm && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setListError(null);
                    setRestoreMessage(null);
                    startTransition(async () => {
                      try {
                        const { recovered, noneFound } = await recoverHiddenMenuBlocks();
                        router.refresh();
                        if (noneFound) {
                          setRestoreMessage("No hidden blocks found. If data was deleted, restore from a database backup (see RESTORE_DATA.md).");
                        } else if (recovered.length > 0) {
                          setRestoreMessage(
                            `Recovered hidden blocks: ${recovered.map((r) => `${r.menuKey} (${r.keysRestored.join(", ")})`).join("; ")}.`
                          );
                        }
                      } catch (err) {
                        setListError(err instanceof Error ? err.message : "Recovery failed");
                      }
                    });
                  }}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm border border-amber-500/50 bg-amber-500/10 text-foreground rounded-lg hover:bg-amber-500/20 transition-colors flex items-center gap-2"
                  title="Make hidden menu blocks visible again (blocks that were removed from the component list but not deleted)"
                >
                  <UnfoldHorizontal className="h-4 w-4" />
                  Recover hidden blocks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setListError(null);
                    setRestoreMessage(null);
                    startTransition(async () => {
                      try {
                        const { updated } = await restoreDefaultMenuComponents();
                        router.refresh();
                        if (updated.length > 0) {
                          setRestoreMessage(`Restored default components for: ${updated.join(", ")}.`);
                        } else {
                          setRestoreMessage("All default menus already have their default components.");
                        }
                      } catch (err) {
                        setListError(err instanceof Error ? err.message : "Restore failed");
                      }
                    });
                  }}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded-lg hover:bg-panel2 transition-colors flex items-center gap-2"
                  title="Re-add default components (e.g. title, pill_list) to Skills, Experience, etc. without removing any existing components"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore default components
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="px-3 py-1.5 text-sm bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Menu
                </button>
              </>
            )}
          </div>
        </div>
        {restoreMessage && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">{restoreMessage}</p>
        )}
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
                  createErrors.key ? "border-red-500" : "border-border"
                }`}
                disabled={isPending || keyCheckPending}
                aria-invalid={!!createErrors.key}
              />
              {createErrors.key && (
                <p className="mt-1 text-xs text-red-500">{createErrors.key}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Label</label>
              <input
                type="text"
                value={newMenuLabel}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewMenuLabel(value);
                  setCreateErrors((prev) => ({ ...prev, label: validateLabelLocal(value) ?? undefined }));
                }}
                placeholder="e.g. Certifications"
                maxLength={TEXT_LIMITS.PLATFORM_MENU_LABEL}
                className={`w-full px-2 py-1 border rounded text-sm bg-background text-foreground ${
                  createErrors.label ? "border-red-500" : "border-border"
                }`}
                disabled={isPending}
                aria-invalid={!!createErrors.label}
              />
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>{newMenuLabel.length} / {TEXT_LIMITS.PLATFORM_MENU_LABEL}</span>
                {createErrors.label && <span className="text-red-500">{createErrors.label}</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Order (platform list)</label>
              <input
                type="number"
                min={0}
                value={newMenuOrder}
                onChange={(e) => setNewMenuOrder(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground"
                disabled={isPending}
              />
            </div>
            <ComponentListEditor
              keys={newMenuComponentKeys}
              onChange={setNewMenuComponentKeys}
              error={createErrors.components}
              disabled={isPending}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateMenu}
                disabled={isPending || keyCheckPending || !isCreateValid}
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
                  setNewMenuOrder(0);
                  setNewMenuComponentKeys([]);
                  setCreateErrors({});
                }}
                disabled={isPending}
                className="px-3 py-1.5 text-sm border border-border bg-background text-foreground rounded-lg hover:bg-panel2 disabled:opacity-50"
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
          menus.map((menu) => {
            const compKeys = parseComponentKeys(menu.componentKeys);
            const isLegacy = compKeys.length === 0 && menu.sectionType;
            return (
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
                          <code className="text-xs bg-panel2 px-1.5 py-0.5 rounded">{menu.key}</code>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground">Label</label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => {
                            setEditLabel(e.target.value);
                            setEditErrors((prev) => ({ ...prev, label: validateLabelLocal(e.target.value) ?? undefined }));
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
                        <label className="block text-xs font-medium text-foreground mb-1">Order</label>
                        <input
                          type="number"
                          min={0}
                          value={editOrder}
                          onChange={(e) => setEditOrder(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground"
                        />
                      </div>
                      {PROTECTED_MENU_KEYS.has(menu.key) ? (
                        <div className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-muted">
                          <span className="font-medium text-foreground">Protected.</span> UI components for main menus (Skills, Experience, etc.) cannot be changed here.
                        </div>
                      ) : (
                        <ComponentListEditor
                          keys={editComponentKeys}
                          onChange={setEditComponentKeys}
                          error={editErrors.components}
                          disabled={isPending}
                        />
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs text-muted bg-panel2 px-1.5 py-0.5 rounded">
                          {menu.key}
                        </code>
                        <span className="text-sm font-medium text-foreground">{menu.label}</span>
                        <span className="text-xs text-muted">Order: {menu.order}</span>
                        {isLegacy && (
                          <span className="text-xs text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            Legacy
                          </span>
                        )}
                        {compKeys.length > 0 && (
                          <span className="text-xs text-muted">
                            {compKeys.map((k) => getUIComponentDef(k)?.label ?? k).join(" → ")}
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
                          !editLabel.trim()
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
                        className="p-1.5 text-muted hover:bg-panel2 rounded disabled:opacity-50"
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
                        className="p-1.5 text-muted hover:bg-panel2 rounded disabled:opacity-50"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(menu)}
                        disabled={isPending}
                        className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                          menu.enabled ? "text-green-400 hover:bg-green-500/10" : "text-muted hover:bg-panel2"
                        }`}
                        title={menu.enabled ? "Disable menu" : "Enable menu"}
                      >
                        {menu.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMenu(menu)}
                        disabled={isPending || PROTECTED_MENU_KEYS.has(menu.key)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded disabled:opacity-50"
                        title={PROTECTED_MENU_KEYS.has(menu.key) ? "Main menus cannot be deleted" : "Delete menu"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
