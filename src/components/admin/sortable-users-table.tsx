"use client";

import { useState, useMemo } from "react";
import { Users, ArrowUp, ArrowDown } from "lucide-react";
import { UserActionsMenu } from "@/components/admin/user-actions-menu";
import { UsersTableFilters } from "@/components/admin/users-table-filters";
import { ColumnVisibilityControl, useColumnVisibility, type ColumnId } from "@/components/admin/column-visibility-control";

type UserWithPortfolio = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  portfolio: {
    id: string;
    slug: string | null;
    status: string;
    requestedAt: Date | null;
    approvedAt: Date | null;
    createdAt: Date;
    personInfo: {
      avatarUrl: string | null;
      updatedAt: Date;
    } | null;
  } | null;
};

type SortField = "created" | "requested" | "approved" | "email" | "name";
type SortDirection = "asc" | "desc";

export function SortableUsersTable({
  users: initialUsers,
  currentImpersonation,
  currentUserId,
  onImpersonate,
}: {
  users: UserWithPortfolio[];
  currentImpersonation: string | null;
  currentUserId: string;
  onImpersonate: (portfolioId: string | null) => void;
}) {
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibleColumns, setVisibleColumns] = useColumnVisibility();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = user.name?.toLowerCase().includes(query);
        const matchesEmail = user.email.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      if (roleFilter && user.role !== roleFilter) return false;

      if (statusFilter) {
        if (statusFilter === "no_portfolio" && user.portfolio) return false;
        if (statusFilter !== "no_portfolio" && (!user.portfolio || user.portfolio.status !== statusFilter)) return false;
      }

      return true;
    });
  }, [initialUsers, searchQuery, roleFilter, statusFilter]);

  // Sort users
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aValue: Date | string | null = null;
      let bValue: Date | string | null = null;

      switch (sortField) {
        case "created":
          aValue = a.portfolio?.createdAt || a.createdAt;
          bValue = b.portfolio?.createdAt || b.createdAt;
          break;
        case "requested":
          aValue = a.portfolio?.requestedAt;
          bValue = b.portfolio?.requestedAt;
          break;
        case "approved":
          aValue = a.portfolio?.approvedAt;
          bValue = b.portfolio?.approvedAt;
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "name":
          aValue = (a.name || a.email).toLowerCase();
          bValue = (b.name || b.email).toLowerCase();
          break;
      }

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      let comparison = 0;
      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredUsers, sortField, sortDirection]);

  const hasActiveFilters = searchQuery !== "" || roleFilter !== "" || statusFilter !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => {
    const isActive = sortField === field;
    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1 text-xs font-semibold text-foreground uppercase tracking-wider hover:text-accent transition-colors ${
          isActive ? "text-accent" : ""
        }`}
        aria-label={`Sort by ${label} ${isActive ? (sortDirection === "asc" ? "ascending" : "descending") : ""}`}
      >
        {label}
        {isActive && (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        )}
      </button>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate visible column count for colSpan
  const visibleColumnCount = Array.from(visibleColumns).length;

  return (
    <div className="space-y-4">
      <UsersTableFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <ColumnVisibilityControl
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
      />

      <div className="border border-border bg-panel rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users ({sortedUsers.length})
          </h2>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-panel2 border-b border-border">
                <tr>
                  {visibleColumns.has("avatar") && (
                    <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-14">Avatar</th>
                  )}
                  {visibleColumns.has("email") && (
                    <th className="px-3 py-3 text-left">
                      <SortButton field="email" label="Email" />
                    </th>
                  )}
                  {visibleColumns.has("name") && (
                    <th className="px-3 py-3 text-left">
                      <SortButton field="name" label="Name" />
                    </th>
                  )}
                  {visibleColumns.has("role") && (
                    <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-24">Role</th>
                  )}
                  {visibleColumns.has("portfolio") && (
                    <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Portfolio</th>
                  )}
                  {visibleColumns.has("status") && (
                    <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-28">Status</th>
                  )}
                  {visibleColumns.has("created") && (
                    <th className="px-3 py-3 text-left hidden xl:table-cell">
                      <SortButton field="created" label="Created" />
                    </th>
                  )}
                  {visibleColumns.has("requested") && (
                    <th className="px-3 py-3 text-left hidden xl:table-cell">
                      <SortButton field="requested" label="Requested" />
                    </th>
                  )}
                  {visibleColumns.has("approved") && (
                    <th className="px-3 py-3 text-left hidden xl:table-cell">
                      <SortButton field="approved" label="Approved" />
                    </th>
                  )}
                  {visibleColumns.has("actions") && (
                    <th className="px-3 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider w-28">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount} className="px-3 py-6 text-center text-muted text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  sortedUsers.map((user) => {
                    const isCurrentlyImpersonating = currentImpersonation === user.portfolio?.id;
                    const avatarUrl = user.portfolio?.personInfo?.avatarUrl;
                    const avatarUpdatedAt = user.portfolio?.personInfo?.updatedAt;
                    const avatarSrc = avatarUrl && avatarUpdatedAt
                      ? `${avatarUrl}?t=${new Date(avatarUpdatedAt).getTime()}`
                      : avatarUrl || null;
                    
                    return (
                      <tr key={user.id} className="border-b border-border hover:bg-panel2/50 transition-colors">
                        {visibleColumns.has("avatar") && (
                          <td className="px-3 py-3">
                            <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-panel2 flex items-center justify-center flex-shrink-0">
                              {avatarSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={avatarSrc}
                                  alt={`${user.name || user.email} avatar`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Users className="h-4 w-4 text-muted" />
                              )}
                            </div>
                          </td>
                        )}
                        {visibleColumns.has("email") && (
                          <td className="px-3 py-3 text-xs text-foreground font-medium">
                            <div className="truncate max-w-[200px]" title={user.email}>{user.email}</div>
                          </td>
                        )}
                        {visibleColumns.has("name") && (
                          <td className="px-3 py-3 text-xs text-muted">
                            <div className="truncate max-w-[150px]" title={user.name || undefined}>{user.name || "—"}</div>
                          </td>
                        )}
                        {visibleColumns.has("role") && (
                          <td className="px-3 py-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                user.role === "super_admin"
                                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  : "bg-muted/10 text-muted border border-border/50"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                        )}
                        {visibleColumns.has("portfolio") && (
                          <td className="px-3 py-3 text-xs text-muted">
                            {user.portfolio ? (
                              <div className="min-w-0 max-w-[150px]">
                                <div className="text-foreground font-medium truncate" title={user.portfolio.slug || user.email.split("@")[0] || "Portfolio"}>
                                  {user.portfolio.slug || user.email.split("@")[0] || "Portfolio"}
                                </div>
                                {user.portfolio.slug && (
                                  <div className="text-xs text-muted-disabled mt-0.5 truncate" title={user.email}>{user.email}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-disabled">No portfolio</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.has("status") && (
                          <td className="px-3 py-3">
                            {user.portfolio ? (
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  user.portfolio.status === "PUBLISHED"
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : user.portfolio.status === "READY_FOR_REVIEW"
                                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                    : user.portfolio.status === "REJECTED"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-muted/10 text-muted border border-border/50"
                                }`}
                              >
                                {user.portfolio.status === "PUBLISHED" && "Published"}
                                {user.portfolio.status === "READY_FOR_REVIEW" && "Pending"}
                                {user.portfolio.status === "REJECTED" && "Rejected"}
                                {(!user.portfolio.status || user.portfolio.status === "DRAFT") && "Draft"}
                              </span>
                            ) : (
                              <span className="text-muted-disabled text-xs">—</span>
                            )}
                          </td>
                        )}
                        {visibleColumns.has("created") && (
                          <td className="px-3 py-3 text-xs text-muted-disabled hidden xl:table-cell">
                            <div className="truncate max-w-[140px]" title={formatDate(user.portfolio?.createdAt || user.createdAt) || undefined}>
                              {formatDate(user.portfolio?.createdAt || user.createdAt) || "—"}
                            </div>
                          </td>
                        )}
                        {visibleColumns.has("requested") && (
                          <td className="px-3 py-3 text-xs text-muted-disabled hidden xl:table-cell">
                            <div className="truncate max-w-[140px]" title={user.portfolio?.requestedAt ? formatDate(user.portfolio.requestedAt) || undefined : undefined}>
                              {user.portfolio?.requestedAt ? formatDate(user.portfolio.requestedAt) : "Not yet"}
                            </div>
                          </td>
                        )}
                        {visibleColumns.has("approved") && (
                          <td className="px-3 py-3 text-xs text-muted-disabled hidden xl:table-cell">
                            <div className="truncate max-w-[140px]" title={user.portfolio?.approvedAt ? formatDate(user.portfolio.approvedAt) || undefined : undefined}>
                              {user.portfolio?.approvedAt ? formatDate(user.portfolio.approvedAt) : "Not yet"}
                            </div>
                          </td>
                        )}
                        {visibleColumns.has("actions") && (
                          <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                            {user.portfolio || user.id !== currentUserId ? (
                              <UserActionsMenu
                                user={user}
                                isCurrentlyImpersonating={isCurrentlyImpersonating}
                                currentUserId={currentUserId}
                                onImpersonate={onImpersonate}
                              />
                            ) : (
                              <span className="text-muted-disabled text-xs">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {sortedUsers.length === 0 ? (
            <div className="px-4 py-6 text-center text-muted text-sm">
              No users found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedUsers.map((user) => {
                const isCurrentlyImpersonating = currentImpersonation === user.portfolio?.id;
                const avatarUrl = user.portfolio?.personInfo?.avatarUrl;
                const avatarUpdatedAt = user.portfolio?.personInfo?.updatedAt;
                const avatarSrc = avatarUrl && avatarUpdatedAt
                  ? `${avatarUrl}?t=${new Date(avatarUpdatedAt).getTime()}`
                  : avatarUrl || null;

                return (
                  <div key={user.id} className="p-4 hover:bg-panel2/50 transition-colors">
                    <div className="flex items-start gap-3">
                      {visibleColumns.has("avatar") && (
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-border bg-panel2 flex items-center justify-center flex-shrink-0">
                          {avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarSrc}
                              alt={`${user.name || user.email} avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-muted" />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {visibleColumns.has("name") && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold text-foreground truncate">{user.name || user.email}</h3>
                                {user.name && visibleColumns.has("email") && (
                                  <span className="text-xs text-muted truncate">{user.email}</span>
                                )}
                              </div>
                            )}
                            {!visibleColumns.has("name") && visibleColumns.has("email") && (
                              <h3 className="text-sm font-semibold text-foreground truncate">{user.email}</h3>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {visibleColumns.has("role") && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    user.role === "super_admin"
                                      ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                      : "bg-muted/10 text-muted border border-border/50"
                                  }`}
                                >
                                  {user.role}
                                </span>
                              )}
                              {visibleColumns.has("status") && user.portfolio && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    user.portfolio.status === "PUBLISHED"
                                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                      : user.portfolio.status === "READY_FOR_REVIEW"
                                      ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                      : user.portfolio.status === "REJECTED"
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                      : "bg-muted/10 text-muted border border-border/50"
                                  }`}
                                >
                                  {user.portfolio.status === "PUBLISHED" && "Published"}
                                  {user.portfolio.status === "READY_FOR_REVIEW" && "Pending"}
                                  {user.portfolio.status === "REJECTED" && "Rejected"}
                                  {(!user.portfolio.status || user.portfolio.status === "DRAFT") && "Draft"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(visibleColumns.has("portfolio") || 
                      visibleColumns.has("created") || 
                      visibleColumns.has("requested") || 
                      visibleColumns.has("approved") || 
                      visibleColumns.has("actions")) && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {visibleColumns.has("portfolio") && (
                            <div>
                              <span className="text-muted-disabled">Portfolio:</span>
                              <div className="text-foreground font-medium mt-0.5">
                                {user.portfolio ? (
                                  user.portfolio.slug || user.email.split("@")[0] || "Portfolio"
                                ) : (
                                  <span className="text-muted-disabled">No portfolio</span>
                                )}
                              </div>
                            </div>
                          )}
                          {visibleColumns.has("created") && (
                            <div>
                              <span className="text-muted-disabled">Created:</span>
                              <div className="text-foreground mt-0.5">
                                {formatDate(user.portfolio?.createdAt || user.createdAt) || "—"}
                              </div>
                            </div>
                          )}
                          {visibleColumns.has("requested") && user.portfolio?.requestedAt && (
                            <div>
                              <span className="text-muted-disabled">Requested:</span>
                              <div className="text-foreground mt-0.5">
                                {formatDate(user.portfolio.requestedAt)}
                              </div>
                            </div>
                          )}
                          {visibleColumns.has("approved") && user.portfolio?.approvedAt && (
                            <div>
                              <span className="text-muted-disabled">Approved:</span>
                              <div className="text-foreground mt-0.5">
                                {formatDate(user.portfolio.approvedAt)}
                              </div>
                            </div>
                          )}
                        </div>

                        {visibleColumns.has("actions") && (
                          <div className="pt-2">
                            {user.portfolio || user.id !== currentUserId ? (
                              <UserActionsMenu
                                user={user}
                                isCurrentlyImpersonating={isCurrentlyImpersonating}
                                currentUserId={currentUserId}
                                onImpersonate={onImpersonate}
                              />
                            ) : (
                              <span className="text-muted-disabled text-xs">—</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
