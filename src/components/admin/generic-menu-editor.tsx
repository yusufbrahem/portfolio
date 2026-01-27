"use client";

import { useState, useTransition } from "react";
import { getUIComponentDef } from "@/lib/ui-components";
import { updateMenuBlock } from "@/app/actions/menu-blocks";
import { uploadMenuFile } from "@/app/actions/upload";
import { TEXT_LIMITS, getCharCountDisplay } from "@/lib/text-limits";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Upload, Link as LinkIcon, Trash2, Eye, EyeOff, Check, Loader2, Eraser } from "lucide-react";

type Block = {
  id: string;
  componentKey: string;
  order: number;
  data: Record<string, unknown>;
};

type GenericMenuEditorProps = {
  menuLabel: string;
  portfolioId: string;
  blocks: Block[];
};

type MenuItem = { id: string; value: string; visible: boolean };

type FileLinkItem = {
  id: string;
  title: string;
  type: "upload" | "link";
  fileUrl?: string;
  externalUrl?: string;
  visible?: boolean;
};

function normalizeFileLinkItems(data: Record<string, unknown>): FileLinkItem[] {
  const raw = data.items;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map((it, i) => {
      if (it && typeof it === "object" && "id" in it && "title" in it) {
        const o = it as { id?: string; title?: string; type?: string; fileUrl?: string; externalUrl?: string; visible?: boolean };
        return {
          id: typeof o.id === "string" ? o.id : `fl-${i}-${Date.now()}`,
          title: typeof o.title === "string" ? o.title : "",
          type: o.type === "upload" ? "upload" : "link",
          fileUrl: typeof o.fileUrl === "string" ? o.fileUrl : undefined,
          externalUrl: typeof o.externalUrl === "string" ? o.externalUrl : undefined,
          visible: o.visible !== false,
        };
      }
      return { id: `fl-${i}-${Date.now()}`, title: "", type: "link" as const, visible: true };
    });
  }
  const title = typeof data.title === "string" ? data.title : "";
  const type = data.type === "upload" ? "upload" : "link";
  const fileUrl = typeof data.fileUrl === "string" ? data.fileUrl : undefined;
  const externalUrl = typeof data.externalUrl === "string" ? data.externalUrl : undefined;
  if (title || fileUrl || externalUrl) {
    return [{ id: "fl-0", title, type, fileUrl, externalUrl, visible: true }];
  }
  return [];
}

const DISABLED_FIELDS_KEY = "_disabledFields";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(s: string): boolean {
  return s.trim() === "" || EMAIL_REGEX.test(s.trim());
}

function getDisabledFields(data: Record<string, unknown>): string[] {
  const v = data[DISABLED_FIELDS_KEY];
  return Array.isArray(v) ? v.filter((k) => typeof k === "string") : [];
}

function isFieldDisabled(data: Record<string, unknown>, key: string): boolean {
  return getDisabledFields(data).includes(key);
}

function toggleFieldDisabled(
  setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
  key: string
) {
  setData((d) => {
    const list = getDisabledFields(d);
    const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
    return { ...d, [DISABLED_FIELDS_KEY]: next };
  });
}

function clearField(
  setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
  key: string,
  defaultValue: unknown
) {
  setData((d) => ({ ...d, [key]: defaultValue }));
}

function ContactEmailInput({
  value,
  onChange,
  onBlurValidate,
  disabled,
  errorMessage,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlurValidate: (value: string) => boolean;
  disabled: boolean;
  errorMessage: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const handleBlur = () => {
    if (onBlurValidate(value)) setError(null);
    else setError(errorMessage);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (error && onBlurValidate(e.target.value)) setError(null);
  };
  return (
    <>
      <input
        type="email"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded bg-background text-foreground ${error ? "border-red-500" : "border-border"}`}
        aria-invalid={!!error}
        aria-describedby={error ? "email-error" : undefined}
      />
      {error && (
        <p id="email-error" className="text-xs text-red-500 mt-1" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function FieldControl({
  fieldKey,
  label,
  data,
  setData,
  disabled,
  onClear,
  clearDisabled,
  children,
}: {
  fieldKey: string;
  label: string;
  data: Record<string, unknown>;
  setData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  disabled: boolean;
  onClear: () => void;
  clearDisabled?: boolean;
  children: React.ReactNode;
}) {
  const isDisabled = isFieldDisabled(data, fieldKey);
  return (
    <div className={isDisabled ? "opacity-60" : undefined}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="block text-xs text-muted">{label}</label>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => toggleFieldDisabled(setData, fieldKey)}
            disabled={disabled}
            className="p-1.5 rounded text-muted hover:bg-panel2 transition-colors disabled:opacity-50"
            title={isDisabled ? "Show on public site" : "Hide on public site"}
          >
            {isDisabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled || clearDisabled}
            className="p-1.5 rounded text-muted hover:bg-panel2 transition-colors disabled:opacity-50 flex items-center gap-1"
            title="Clear value"
          >
            <Eraser className="h-4 w-4" />
            <span className="text-xs">Clear</span>
          </button>
        </div>
      </div>
      <div className={isDisabled ? "pointer-events-none" : undefined}>{children}</div>
    </div>
  );
}

function SaveBlockButton({
  onClick,
  disabled,
  isSaving,
  justSaved,
}: {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  justSaved: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isSaving}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        transition-all duration-200 min-w-[6.5rem] justify-center
        disabled:pointer-events-none
        ${justSaved
          ? "bg-emerald-600 text-white"
          : isSaving
            ? "bg-accent/80 text-foreground cursor-wait"
            : "bg-accent text-foreground hover:bg-accent/90 hover:brightness-105 active:scale-[0.98]"
        }
      `}
    >
      {justSaved ? (
        <>
          <Check className="h-4 w-4 shrink-0" />
          Saved
        </>
      ) : isSaving ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          Saving…
        </>
      ) : (
        "Save"
      )}
    </button>
  );
}

function normalizeItems(data: Record<string, unknown>): MenuItem[] {
  const raw = data.items;
  if (!Array.isArray(raw)) return [];
  return raw.map((it, i) => {
    if (it && typeof it === "object" && "id" in it && "value" in it) {
      const o = it as { id: string; value: string; visible?: boolean };
      return { id: o.id || `i-${i}`, value: String(o.value ?? ""), visible: o.visible !== false };
    }
    return { id: `i-${i}`, value: String(it ?? ""), visible: true };
  });
}

export function GenericMenuEditor({ menuLabel, portfolioId, blocks: initialBlocks }: GenericMenuEditorProps) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingBlockId, setSavingBlockId] = useState<string | null>(null);
  const [lastSavedBlockId, setLastSavedBlockId] = useState<string | null>(null);

  const handleSave = (blockId: string, componentKey: string, data: Record<string, unknown>) => {
    setSaveError(null);
    setSavingBlockId(blockId);
    startTransition(async () => {
      try {
        await updateMenuBlock(blockId, componentKey, data);
        setBlocks((prev) =>
          prev.map((b) => (b.id === blockId ? { ...b, data } : b))
        );
        setLastSavedBlockId(blockId);
        setTimeout(() => setLastSavedBlockId(null), 2000);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setSavingBlockId(null);
      }
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">{menuLabel}</h1>
      <p className="text-sm text-muted">
        Edit each block and click Save to persist. No changes are published until you publish menu configuration.
      </p>
      {saveError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600">
          {saveError}
        </div>
      )}
      <div className="space-y-6">
        {blocks.map((block) => (
          <BlockEditor
            key={block.id}
            block={block}
            portfolioId={portfolioId}
            onSave={(data) => handleSave(block.id, block.componentKey, data)}
            disabled={isPending}
            isSaving={savingBlockId === block.id}
            justSaved={lastSavedBlockId === block.id}
          />
        ))}
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  portfolioId,
  onSave,
  disabled,
  isSaving,
  justSaved,
}: {
  block: Block;
  portfolioId: string;
  onSave: (data: Record<string, unknown>) => void;
  disabled: boolean;
  isSaving: boolean;
  justSaved: boolean;
}) {
  const def = getUIComponentDef(block.componentKey);
  const label = def?.label ?? block.componentKey;
  const [data, setData] = useState<Record<string, unknown>>(() => {
    const raw = block.data || {};
    if (block.componentKey === "file_link") {
      return {
        ...raw,
        title: typeof raw.title === "string" ? raw.title : "",
        type: raw.type ?? "link",
        fileUrl: typeof raw.fileUrl === "string" ? raw.fileUrl : "",
        externalUrl: typeof raw.externalUrl === "string" ? raw.externalUrl : "",
      };
    }
    return raw;
  });
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "primary";
    onConfirm: () => void;
  } | null>(null);

  const update = (key: string, value: unknown) => setData((d) => ({ ...d, [key]: value }));
  const save = () => onSave(data);
  const openConfirm = (args: {
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "primary";
    onConfirm: () => void;
  }) => setConfirm(args);
  const closeConfirm = () => setConfirm(null);

  let sectionContent: React.ReactNode = null;
  switch (block.componentKey) {
    case "title": {
      const text = (data.text as string) ?? "";
      const hasAnyValue = !!text;
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <FieldControl
            fieldKey="text"
            label="Title"
            data={data}
            setData={setData}
            disabled={disabled}
            onClear={() => clearField(setData, "text", "")}
            clearDisabled={!text}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => update("text", e.target.value)}
              maxLength={TEXT_LIMITS.MENU_BLOCK_TITLE}
              disabled={disabled}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              placeholder="Section title"
            />
            <span className="text-xs text-muted block mt-1">{getCharCountDisplay(text.length, TEXT_LIMITS.MENU_BLOCK_TITLE)}</span>
          </FieldControl>
          <div className="mt-2 flex justify-between items-center gap-2">
            {hasAnyValue && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Reset this block’s field to empty?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      clearField(setData, "text", "");
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    case "subtitle": {
      const text = (data.text as string) ?? "";
      const hasAnyValue = !!text;
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <FieldControl
            fieldKey="text"
            label="Subtitle"
            data={data}
            setData={setData}
            disabled={disabled}
            onClear={() => clearField(setData, "text", "")}
            clearDisabled={!text}
          >
            <textarea
              value={text}
              onChange={(e) => update("text", e.target.value)}
              maxLength={TEXT_LIMITS.MENU_BLOCK_SUBTITLE}
              disabled={disabled}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              placeholder="Intro or subtitle"
            />
            <span className="text-xs text-muted block mt-1">{getCharCountDisplay(text.length, TEXT_LIMITS.MENU_BLOCK_SUBTITLE)}</span>
          </FieldControl>
          <div className="mt-2 flex justify-between items-center gap-2">
            {hasAnyValue && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Reset this block’s field to empty?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      clearField(setData, "text", "");
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    case "rich_text": {
      const content = (data.content as string) ?? "";
      const hasAnyValue = !!content;
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <FieldControl
            fieldKey="content"
            label="Content"
            data={data}
            setData={setData}
            disabled={disabled}
            onClear={() => clearField(setData, "content", "")}
            clearDisabled={!content}
          >
            <textarea
              value={content}
              onChange={(e) => update("content", e.target.value)}
              maxLength={TEXT_LIMITS.MENU_BLOCK_RICH_TEXT}
              disabled={disabled}
              rows={8}
              className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              placeholder="Rich text content"
            />
            <span className="text-xs text-muted block mt-1">{getCharCountDisplay(content.length, TEXT_LIMITS.MENU_BLOCK_RICH_TEXT)}</span>
          </FieldControl>
          <div className="mt-2 flex justify-between items-center gap-2">
            {hasAnyValue && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Reset this block’s content to empty?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      clearField(setData, "content", "");
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    case "pill_list": {
      const items = normalizeItems(data);
      const add = () =>
        setData((d) => ({
          ...d,
          items: [
            ...normalizeItems(d),
            { id: `i-${Date.now()}`, value: "", visible: true },
          ],
        }));
      const setItem = (index: number, part: Partial<MenuItem>) => {
        setData((d) => {
          const list = [...normalizeItems(d)];
          list[index] = { ...list[index], ...part };
          return { ...d, items: list };
        });
      };
      const remove = (index: number) => {
        openConfirm({
          title: "Remove item",
          message: "Remove this item from the list?",
          confirmLabel: "Remove",
          variant: "danger",
          onConfirm: () => {
            setData((d) => ({
              ...d,
              items: normalizeItems(d).filter((_, i) => i !== index),
            }));
            closeConfirm();
          },
        });
      };
      const pillListItems = normalizeItems(data);
      const hasAnyValue = pillListItems.length > 0 || pillListItems.some((i) => i.value);
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <FieldControl
            fieldKey="items"
            label="Items"
            data={data}
            setData={setData}
            disabled={disabled}
            onClear={() => clearField(setData, "items", [])}
            clearDisabled={pillListItems.length === 0 && !pillListItems.some((i) => i.value)}
          >
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => setItem(i, { value: e.target.value.slice(0, TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE) })}
                  disabled={disabled}
                  maxLength={TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE}
                  className="flex-1 px-3 py-2 border border-border rounded bg-background text-foreground"
                  placeholder={`Item ${i + 1}`}
                />
                <span className="text-xs text-muted w-12">{item.value.length}/{TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE}</span>
                <button
                  type="button"
                  onClick={() => setItem(i, { visible: !item.visible })}
                  disabled={disabled}
                  title={item.visible ? "Hide on public site" : "Show on public site"}
                  className="p-1.5 rounded text-muted hover:bg-panel2"
                >
                  {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={disabled}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={add} disabled={disabled} className="text-sm text-accent hover:underline">
              + Add item
            </button>
          </div>
          </FieldControl>
          <div className="mt-2 flex justify-between items-center gap-2">
            {hasAnyValue && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Remove all items from this list?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      clearField(setData, "items", []);
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    case "contact_block": {
      const name = (data.name as string) ?? "";
      const email = (data.email as string) ?? "";
      const phone = (data.phone as string) ?? "";
      const message = (data.message as string) ?? "";
      const contactHasAny = name || email || phone || message;
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldControl fieldKey="name" label="Name" data={data} setData={setData} disabled={disabled} onClear={() => clearField(setData, "name", "")} clearDisabled={!name}>
              <input
                type="text"
                value={name}
                onChange={(e) => update("name", e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              />
            </FieldControl>
            <FieldControl fieldKey="email" label="Email" data={data} setData={setData} disabled={disabled} onClear={() => clearField(setData, "email", "")} clearDisabled={!email}>
              <ContactEmailInput
                value={email}
                onChange={(v) => update("email", v)}
                onBlurValidate={(v) => !v.trim() || isValidEmail(v)}
                disabled={disabled}
                errorMessage="Enter a valid email address"
              />
            </FieldControl>
            <FieldControl fieldKey="phone" label="Phone" data={data} setData={setData} disabled={disabled} onClear={() => clearField(setData, "phone", "")} clearDisabled={!phone}>
              <input
                type="text"
                value={phone}
                onChange={(e) => update("phone", e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              />
            </FieldControl>
          </div>
          <div className="mt-3">
            <FieldControl fieldKey="message" label="Contact message" data={data} setData={setData} disabled={disabled} onClear={() => clearField(setData, "message", "")} clearDisabled={!message}>
              <textarea
                value={message}
                onChange={(e) => update("message", e.target.value)}
                maxLength={TEXT_LIMITS.CONTACT_MESSAGE}
                disabled={disabled}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
              />
              <span className="text-xs text-muted block mt-1">{getCharCountDisplay(message.length, TEXT_LIMITS.CONTACT_MESSAGE)}</span>
            </FieldControl>
          </div>
          <div className="mt-2 flex justify-between items-center gap-2">
            {contactHasAny && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Reset all contact fields to empty?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      setData((d) => ({ ...d, name: "", email: "", phone: "", message: "" }));
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    case "pillar_card": {
      const title = (data.title as string) ?? "";
      const description = (data.description as string) ?? "";
      const pillarHasAny = title || description;
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <div className="space-y-2">
            <FieldControl fieldKey="title" label="Card title" data={data} setData={setData} disabled={disabled} onClear={() => clearField(setData, "title", "")} clearDisabled={!title}>
              <input
                type="text"
                value={title}
                onChange={(e) => update("title", e.target.value)}
                maxLength={TEXT_LIMITS.MENU_BLOCK_TITLE}
                disabled={disabled}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                placeholder="Card title"
              />
              <span className="text-xs text-muted block mt-1">{getCharCountDisplay(title.length, TEXT_LIMITS.MENU_BLOCK_TITLE)}</span>
            </FieldControl>
            <FieldControl fieldKey="description" label="Description" data={data} setData={setData} disabled={disabled} onClear={() => clearField(setData, "description", "")} clearDisabled={!description}>
              <textarea
                value={description}
                onChange={(e) => update("description", e.target.value)}
                maxLength={TEXT_LIMITS.MENU_BLOCK_DESCRIPTION}
                disabled={disabled}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded bg-background text-foreground"
                placeholder="Description"
              />
              <span className="text-xs text-muted block mt-1">{getCharCountDisplay(description.length, TEXT_LIMITS.MENU_BLOCK_DESCRIPTION)}</span>
            </FieldControl>
          </div>
          <div className="mt-2 flex justify-between items-center gap-2">
            {pillarHasAny && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Reset title and description to empty?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      setData((d) => ({ ...d, title: "", description: "" }));
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    case "file_link": {
      const fileLinkItems = normalizeFileLinkItems(data);
      const setFileLinkItems = (next: FileLinkItem[]) => setData((d) => ({ ...d, items: next }));
      const setFileLinkItem = (index: number, part: Partial<FileLinkItem>) => {
        setData((d) => {
          const list = [...normalizeFileLinkItems(d)];
          list[index] = { ...list[index], ...part };
          return { ...d, items: list };
        });
      };
      const addFileLinkItem = () =>
        setFileLinkItems([
          ...fileLinkItems,
          { id: `fl-${Date.now()}`, title: "", type: "link", visible: true },
        ]);
      const removeFileLinkItem = (index: number) => {
        openConfirm({
          title: "Remove item",
          message: "Remove this file/link entry?",
          confirmLabel: "Remove",
          variant: "danger",
          onConfirm: () => {
            setFileLinkItems(fileLinkItems.filter((_, i) => i !== index));
            closeConfirm();
          },
        });
      };
      const handleFileUpload = async (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
          const fd = new FormData();
          fd.set("file", file);
          const res = await uploadMenuFile(fd, portfolioId, block.id, itemId);
          if (res.success && res.url) {
            const i = fileLinkItems.findIndex((it) => it.id === itemId);
            if (i !== -1) setFileLinkItem(i, { fileUrl: res.url, type: "upload" });
          }
        } finally {
          setUploading(false);
          e.target.value = "";
        }
      };
      const fileLinkHasAny = fileLinkItems.length > 0 && fileLinkItems.some((it) => it.title || it.fileUrl || it.externalUrl);
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <div className="space-y-4">
            {fileLinkItems.map((item, i) => (
              <div key={item.id} className="p-3 border border-border rounded-lg space-y-2 bg-panel2/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted">Item {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFileLinkItem(i, { visible: !item.visible })}
                      disabled={disabled}
                      className="p-1.5 rounded text-muted hover:bg-panel2"
                      title={item.visible ? "Hide on public" : "Show on public"}
                    >
                      {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFileLinkItem(i)}
                      disabled={disabled}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => setFileLinkItem(i, { title: e.target.value.slice(0, TEXT_LIMITS.MENU_BLOCK_TITLE) })}
                    maxLength={TEXT_LIMITS.MENU_BLOCK_TITLE}
                    disabled={disabled}
                    className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                    placeholder="e.g. Certificate PDF"
                  />
                  <span className="text-xs text-muted">{getCharCountDisplay(item.title.length, TEXT_LIMITS.MENU_BLOCK_TITLE)}</span>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`type-${block.id}-${item.id}`}
                        checked={item.type === "upload"}
                        onChange={() => setFileLinkItem(i, { type: "upload" })}
                        disabled={disabled}
                      />
                      <Upload className="h-4 w-4" /> Upload file
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`type-${block.id}-${item.id}`}
                        checked={item.type === "link"}
                        onChange={() => setFileLinkItem(i, { type: "link" })}
                        disabled={disabled}
                      />
                      <LinkIcon className="h-4 w-4" /> External link
                    </label>
                  </div>
                </div>
                {item.type === "upload" ? (
                  <div>
                    <label className="block text-xs text-muted mb-1">File (PDF or image)</label>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => handleFileUpload(item.id, e)}
                      disabled={disabled || uploading}
                      className="w-full text-sm"
                    />
                    {item.fileUrl && <p className="mt-1 text-xs text-muted truncate">Current: {item.fileUrl}</p>}
                    {uploading && <p className="text-xs text-muted">Uploading…</p>}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-muted mb-1">URL</label>
                    <input
                      type="url"
                      value={item.externalUrl ?? ""}
                      onChange={(e) => setFileLinkItem(i, { externalUrl: e.target.value.slice(0, TEXT_LIMITS.MENU_BLOCK_URL) || "" })}
                      maxLength={TEXT_LIMITS.MENU_BLOCK_URL}
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-border rounded bg-background text-foreground text-sm"
                      placeholder="https://…"
                    />
                    <span className="text-xs text-muted">{getCharCountDisplay((item.externalUrl ?? "").length, TEXT_LIMITS.MENU_BLOCK_URL)}</span>
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={addFileLinkItem} disabled={disabled} className="text-sm text-accent hover:underline">
              + Add file or link
            </button>
          </div>
          <div className="mt-2 flex justify-between items-center gap-2">
            {fileLinkHasAny && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Remove all file/link entries?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      setFileLinkItems([]);
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    case "card_grid": {
      const items = normalizeItems(data);
      const add = () =>
        setData((d) => ({
          ...d,
          items: [
            ...normalizeItems(d),
            { id: `i-${Date.now()}`, value: "", visible: true },
          ],
        }));
      const setItem = (index: number, part: Partial<MenuItem>) => {
        setData((d) => {
          const list = [...normalizeItems(d)];
          list[index] = { ...list[index], ...part };
          return { ...d, items: list };
        });
      };
      const remove = (index: number) => {
        openConfirm({
          title: "Delete card",
          message: "Remove this card from the grid?",
          confirmLabel: "Delete",
          variant: "danger",
          onConfirm: () => {
            setData((d) => ({
              ...d,
              items: normalizeItems(d).filter((_, i) => i !== index),
            }));
            closeConfirm();
          },
        });
      };
      const cardGridItems = normalizeItems(data);
      const cardGridHasAny = cardGridItems.length > 0 || cardGridItems.some((i) => i.value);
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <FieldControl fieldKey="items" label="Cards" data={data} setData={setData} disabled={disabled} onClear={() => clearField(setData, "items", [])} clearDisabled={cardGridItems.length === 0 && !cardGridItems.some((i) => i.value)}>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 p-2 border border-border rounded">
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => setItem(i, { value: e.target.value.slice(0, TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE) })}
                  maxLength={TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE}
                  disabled={disabled}
                  className="flex-1 px-2 py-1.5 border border-border rounded bg-background text-foreground text-sm"
                  placeholder="Card text"
                />
                <span className="text-xs text-muted w-10">{item.value.length}/{TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE}</span>
                <button type="button" onClick={() => setItem(i, { visible: !item.visible })} disabled={disabled} className="p-1.5 rounded text-muted hover:bg-panel2" title={item.visible ? "Hide" : "Show"}>
                  {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
                </button>
                <button type="button" onClick={() => remove(i)} disabled={disabled} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={add} disabled={disabled} className="text-sm text-accent hover:underline">+ Add card</button>
          </div>
          </FieldControl>
          <div className="mt-2 flex justify-between items-center gap-2">
            {cardGridHasAny && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Remove all cards from this grid?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      clearField(setData, "items", []);
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    case "timeline": {
      const items = normalizeItems(data);
      const add = () =>
        setData((d) => ({
          ...d,
          items: [...normalizeItems(d), { id: `i-${Date.now()}`, value: "", visible: true }],
        }));
      const setItem = (index: number, part: Partial<MenuItem>) => {
        setData((d) => {
          const list = [...normalizeItems(d)];
          list[index] = { ...list[index], ...part };
          return { ...d, items: list };
        });
      };
      const remove = (index: number) => {
        openConfirm({
          title: "Delete timeline item",
          message: "Remove this item from the timeline?",
          confirmLabel: "Delete",
          variant: "danger",
          onConfirm: () => {
            setData((d) => ({ ...d, items: normalizeItems(d).filter((_, i) => i !== index) }));
            closeConfirm();
          },
        });
      };
      const timelineItems = normalizeItems(data);
      const timelineHasAny = timelineItems.length > 0 || timelineItems.some((i) => i.value);
      sectionContent = (
        <section className="border border-border rounded-lg p-4 bg-panel">
          <h2 className="text-sm font-medium text-foreground mb-2">{label}</h2>
          <FieldControl fieldKey="items" label="Timeline entries" data={data} setData={setData} disabled={disabled} onClear={() => clearField(setData, "items", [])} clearDisabled={timelineItems.length === 0 && !timelineItems.some((i) => i.value)}>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 p-2 border border-border rounded">
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => setItem(i, { value: e.target.value.slice(0, TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE) })}
                  maxLength={TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE}
                  disabled={disabled}
                  className="flex-1 px-2 py-1.5 border border-border rounded bg-background text-foreground text-sm"
                  placeholder="Timeline entry"
                />
                <span className="text-xs text-muted w-10">{item.value.length}/{TEXT_LIMITS.MENU_BLOCK_ITEM_VALUE}</span>
                <button type="button" onClick={() => setItem(i, { visible: !item.visible })} disabled={disabled} className="p-1.5 rounded text-muted hover:bg-panel2" title={item.visible ? "Hide" : "Show"}>
                  {item.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-50" />}
                </button>
                <button type="button" onClick={() => remove(i)} disabled={disabled} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={add} disabled={disabled} className="text-sm text-accent hover:underline">+ Add item</button>
          </div>
          </FieldControl>
          <div className="mt-2 flex justify-between items-center gap-2">
            {timelineHasAny && (
              <button
                type="button"
                onClick={() =>
                  openConfirm({
                    title: "Clear all",
                    message: "Remove all timeline entries?",
                    confirmLabel: "Clear all",
                    variant: "danger",
                    onConfirm: () => {
                      clearField(setData, "items", []);
                      closeConfirm();
                    },
                  })
                }
                disabled={disabled}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            )}
            <SaveBlockButton onClick={save} disabled={disabled} isSaving={isSaving} justSaved={justSaved} />
          </div>
        </section>
      );
      break;
    }
    default:
      sectionContent = null;
  }

  return (
    <>
      {sectionContent}
      {confirm && (
        <ConfirmModal
          open
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          variant={confirm.variant}
          onConfirm={() => {
            confirm.onConfirm();
            closeConfirm();
          }}
          onCancel={closeConfirm}
        />
      )}
    </>
  );
}
