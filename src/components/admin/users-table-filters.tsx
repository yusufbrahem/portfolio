"use client";

import { Search, Filter, X } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";

type UsersTableFiltersProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  roleFilter: string;
  onRoleFilterChange: (role: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
};

export function UsersTableFilters({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
  hasActiveFilters,
}: UsersTableFiltersProps) {
  return (
    <Accordion
      title="Search & Filters"
      icon={<Filter className="h-4 w-4" />}
      defaultOpen={false}
      className="mb-4"
    >
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="user-search" className="block text-sm font-medium text-foreground mb-2">
            Search by Name or Email
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              id="user-search"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-foreground mb-2">
              Role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-foreground mb-2">
              Portfolio Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="READY_FOR_REVIEW">Pending Review</option>
              <option value="REJECTED">Rejected</option>
              <option value="DRAFT">Draft</option>
              <option value="no_portfolio">No Portfolio</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>
    </Accordion>
  );
}
