"use client";

import { useState, useEffect } from "react";
import { Columns, Eye, EyeOff } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";

type ColumnId = 
  | "avatar"
  | "email"
  | "name"
  | "role"
  | "portfolio"
  | "status"
  | "created"
  | "requested"
  | "approved"
  | "actions";

type ColumnConfig = {
  id: ColumnId;
  label: string;
  defaultVisible: boolean;
};

const COLUMN_CONFIGS: ColumnConfig[] = [
  { id: "avatar", label: "Avatar", defaultVisible: true },
  { id: "email", label: "Email", defaultVisible: true },
  { id: "name", label: "Name", defaultVisible: true },
  { id: "role", label: "Role", defaultVisible: true },
  { id: "portfolio", label: "Portfolio", defaultVisible: false },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "created", label: "Created", defaultVisible: true },
  { id: "requested", label: "Requested", defaultVisible: true },
  { id: "approved", label: "Approved", defaultVisible: false },
  { id: "actions", label: "Actions", defaultVisible: true },
];

const STORAGE_KEY = "users-table-column-visibility";

type ColumnVisibilityControlProps = {
  visibleColumns: Set<ColumnId>;
  onColumnsChange: (columns: Set<ColumnId>) => void;
};

export function ColumnVisibilityControl({
  visibleColumns,
  onColumnsChange,
}: ColumnVisibilityControlProps) {
  const toggleColumn = (columnId: ColumnId) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    onColumnsChange(newVisible);
  };

  const resetToDefaults = () => {
    const defaults = new Set(
      COLUMN_CONFIGS
        .filter(col => col.defaultVisible)
        .map(col => col.id)
    );
    onColumnsChange(defaults);
  };

  return (
    <Accordion
      title="Column Visibility"
      icon={<Columns className="h-4 w-4" />}
      defaultOpen={false}
      className="mb-4"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {COLUMN_CONFIGS.map((column) => {
            const isVisible = visibleColumns.has(column.id);
            const isRequired = column.id === "actions"; // Actions column is always required
            
            return (
              <label
                key={column.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isVisible
                    ? "bg-panel2 border-border"
                    : "bg-panel border-border/50 opacity-60"
                } ${isRequired ? "opacity-100 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => !isRequired && toggleColumn(column.id)}
                  disabled={isRequired}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-2 focus:ring-accent disabled:opacity-50"
                />
                <span className="text-sm text-foreground flex-1">{column.label}</span>
                {isVisible ? (
                  <Eye className="h-4 w-4 text-muted" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted" />
                )}
              </label>
            );
          })}
        </div>
        
        <button
          type="button"
          onClick={resetToDefaults}
          className="w-full px-3 py-2 text-sm text-muted hover:text-foreground transition-colors border border-border rounded-lg hover:bg-panel2"
        >
          Reset to Defaults
        </button>
      </div>
    </Accordion>
  );
}

export function useColumnVisibility() {
  // Always start with defaults to avoid hydration mismatch
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnId>>(() => {
    return new Set(
      COLUMN_CONFIGS
        .filter(col => col.defaultVisible)
        .map(col => col.id)
    );
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnId[];
        setVisibleColumns(new Set(parsed));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage when columns change (only after hydration)
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)));
      } catch {
        // Ignore storage errors
      }
    }
  }, [visibleColumns, isHydrated]);

  return [visibleColumns, setVisibleColumns] as const;
}

export type { ColumnId };
