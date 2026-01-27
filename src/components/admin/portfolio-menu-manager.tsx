"use client";

import { useState, useTransition } from "react";
import { Menu, GripVertical, Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  updatePortfolioMenuVisibility,
  reorderPortfolioMenus,
} from "@/app/actions/portfolio-menu";
import { PortfolioMenu } from "@prisma/client";
import { hasSectionEditor } from "@/lib/section-types";

type PortfolioMenuWithPlatform = PortfolioMenu & {
  platformMenu: {
    id: string;
    key: string;
    label: string;
    sectionType: string;
    enabled: boolean;
  };
};

type PortfolioMenuManagerProps = {
  menus: PortfolioMenuWithPlatform[];
  portfolioId: string;
};

export function PortfolioMenuManager({
  menus: initialMenus,
  portfolioId,
}: PortfolioMenuManagerProps) {
  const [menus, setMenus] = useState(initialMenus);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleVisibility = (menuId: string, currentVisible: boolean) => {
    startTransition(async () => {
      try {
        await updatePortfolioMenuVisibility(menuId, !currentVisible);
        setMenus((prev) =>
          prev.map((m) => (m.id === menuId ? { ...m, visible: !m.visible } : m))
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to update menu visibility");
      }
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMenus = [...menus];
    const draggedMenu = newMenus[draggedIndex];
    newMenus.splice(draggedIndex, 1);
    newMenus.splice(index, 0, draggedMenu);
    setMenus(newMenus);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null) return;

    const menuIds = menus.map((m) => m.id);
    startTransition(async () => {
      try {
        await reorderPortfolioMenus(portfolioId, menuIds);
        setDraggedIndex(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to reorder menus");
        // Revert to initial order on error
        setMenus(initialMenus);
        setDraggedIndex(null);
      }
    });
  };

  return (
    <div className="border border-border bg-panel rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Menu className="h-5 w-5" />
          Menu Configuration
        </h2>
        <p className="text-sm text-muted mt-1">
          Reorder and show/hide menus in your portfolio navigation. Drag to reorder.
        </p>
      </div>

      <div className="divide-y divide-border">
        {menus.length === 0 ? (
          <div className="px-4 py-6 text-center text-muted text-sm">
            No menus available
          </div>
        ) : (
          menus.map((menu, index) => (
            <div
              key={menu.id}
              draggable={menu.platformMenu.enabled && hasSectionEditor(menu.platformMenu.sectionType)}
              onDragStart={() =>
                menu.platformMenu.enabled &&
                hasSectionEditor(menu.platformMenu.sectionType) &&
                handleDragStart(index)
              }
              onDragOver={(e) =>
                menu.platformMenu.enabled &&
                hasSectionEditor(menu.platformMenu.sectionType) &&
                handleDragOver(e, index)
              }
              onDragEnd={handleDragEnd}
              className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                !menu.platformMenu.enabled || !hasSectionEditor(menu.platformMenu.sectionType)
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-panel2/50 cursor-move"
              } ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
            >
              <GripVertical className="h-5 w-5 text-muted flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs text-muted bg-panel2 px-1.5 py-0.5 rounded">
                    {menu.platformMenu.key}
                  </code>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${
                        !menu.platformMenu.enabled
                          ? "text-muted-disabled"
                          : menu.visible
                          ? "text-foreground"
                          : "text-muted line-through"
                      }`}
                    >
                      {menu.platformMenu.label}
                    </span>
                    {!menu.platformMenu.enabled && (
                      <span className="text-xs text-muted-disabled">
                        (Platform Disabled)
                      </span>
                    )}
                    {!hasSectionEditor(menu.platformMenu.sectionType) && (
                      <span className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                        <AlertCircle className="h-3 w-3" />
                        No Editor
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleVisibility(menu.id, menu.visible)}
                disabled={
                  isPending ||
                  !menu.platformMenu.enabled ||
                  !hasSectionEditor(menu.platformMenu.sectionType)
                }
                className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                  !menu.platformMenu.enabled || !hasSectionEditor(menu.platformMenu.sectionType)
                    ? "text-muted-disabled cursor-not-allowed"
                    : menu.visible
                    ? "text-green-400 hover:bg-green-500/10"
                    : "text-muted hover:bg-panel2"
                }`}
                title={
                  !menu.platformMenu.enabled
                    ? "This section is disabled by the platform and cannot be shown publicly"
                    : !hasSectionEditor(menu.platformMenu.sectionType)
                    ? "This section cannot be enabled until an editor exists"
                    : menu.visible
                    ? "Hide menu"
                    : "Show menu"
                }
              >
                {menu.visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
