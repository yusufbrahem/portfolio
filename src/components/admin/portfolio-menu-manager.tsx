"use client";

import { useState, useTransition } from "react";
import { Menu, GripVertical, Eye, EyeOff, Upload } from "lucide-react";
import {
  updatePortfolioMenuVisibility,
  reorderPortfolioMenus,
  publishMenuConfiguration,
} from "@/app/actions/portfolio-menu";
import { PortfolioMenu } from "@prisma/client";

type PortfolioMenuWithPlatform = PortfolioMenu & {
  platformMenu: {
    id: string;
    key: string;
    label: string;
    sectionType: string | null;
    enabled: boolean;
  };
  publishedVisible?: boolean;
  publishedOrder?: number;
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
        setMenus(initialMenus);
        setDraggedIndex(null);
      }
    });
  };

  // Draft order = current array index; compare to publishedOrder to detect reorder
  const hasUnpublishedChanges =
    menus.some(
      (m, i) =>
        m.visible !== (m.publishedVisible ?? m.visible) ||
        (m.publishedOrder ?? i) !== i
    );

  const handlePublish = () => {
    if (!hasUnpublishedChanges) return;
    if (!window.confirm("Publish menu configuration? This will update your public portfolio.")) return;
    startTransition(async () => {
      try {
        await publishMenuConfiguration(portfolioId);
        setMenus((prev) =>
          prev.map((m, i) => ({
            ...m,
            publishedVisible: m.visible,
            publishedOrder: i,
          }))
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to publish");
      }
    });
  };

  return (
    <div className="border border-border bg-panel rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Menu className="h-5 w-5" />
              Menu Configuration
            </h2>
            <p className="text-sm text-muted mt-1">
              Reorder and show/hide menus. Changes are draft until you publish. Drag to reorder.
            </p>
            {hasUnpublishedChanges && (
              <p className="mt-2 text-sm font-medium text-amber-600">
                You have unpublished changes. Click &quot;Publish changes&quot; to update your public portfolio.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending || !hasUnpublishedChanges}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-foreground rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            Publish changes
          </button>
        </div>
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
              draggable={!!menu.platformMenu.enabled}
              onDragStart={() => menu.platformMenu.enabled && handleDragStart(index)}
              onDragOver={(e) => menu.platformMenu.enabled && handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                !menu.platformMenu.enabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-panel2/50 cursor-move"
              } ${draggedIndex === index ? "opacity-50" : ""}`}
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
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleVisibility(menu.id, menu.visible)}
                disabled={isPending || !menu.platformMenu.enabled}
                className={`p-1.5 rounded transition-colors disabled:opacity-50 ${
                  !menu.platformMenu.enabled
                    ? "text-muted-disabled cursor-not-allowed"
                    : menu.visible
                    ? "text-green-400 hover:bg-green-500/10"
                    : "text-muted hover:bg-panel2"
                }`}
                title={
                  !menu.platformMenu.enabled
                    ? "Disabled by the platform"
                    : menu.visible
                    ? "Hide in menu (draft). Publish to update public site."
                    : "Show in menu (draft). Publish to update public site."
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
