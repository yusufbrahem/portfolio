# Role Hardening - Super Admin Platform-Only Lock

## Overview

This document summarizes the role hardening changes that lock super admin accounts to platform-only behavior. Super admin accounts can no longer edit portfolio content and are restricted to user management and portfolio approval/publishing.

## PART 1: Migration Script

**File**: `prisma/migrate-super-admin-portfolio.ts`

**Purpose**: Transfers existing super admin portfolio data to a new normal user account.

**What it does**:
1. Finds the super admin user and their portfolio
2. Creates a new normal user (role = "user") with a generated email and password
3. Transfers portfolio ownership by updating `portfolio.userId`
4. Preserves all portfolio data (skills, projects, experience, about, hero, personInfo, architecture)
5. Outputs login credentials for the new user

**Usage**:
```bash
npx tsx prisma/migrate-super-admin-portfolio.ts
```

**Important**: Run this ONCE before deploying the role hardening changes. The script will output:
- New user email
- Temporary password (save this!)
- Portfolio slug and public URL

**What gets cloned**:
- All portfolio data is preserved (no duplication)
- Portfolio ownership is transferred via `portfolio.userId`
- Public portfolio URLs remain unchanged (slug preserved)
- All relationships remain intact (cascade deletes still work)

## PART 2: Backend Write Blocking

**File**: `src/lib/auth.ts`

**New Function**: `assertNotSuperAdminForPortfolioWrite()`
- Blocks ALL portfolio write operations for super_admin
- Applies even when NOT impersonating
- Throws clear error: "Super admin accounts are for platform management only. Portfolio editing is disabled."

**Updated Action Files** (all write functions now block super_admin):
- `src/app/actions/skills.ts` - create/update/delete skill groups and skills
- `src/app/actions/projects.ts` - create/update/delete projects
- `src/app/actions/experience.ts` - create/update/delete experience entries
- `src/app/actions/about.ts` - update about content, create/update/delete principles
- `src/app/actions/architecture.ts` - create/update/delete pillars and points
- `src/app/actions/contact.ts` - update person info
- `src/app/actions/hero.ts` - update hero content
- `src/app/actions/upload.ts` - upload avatar (CV upload not blocked - it's not portfolio-specific)
- `src/app/actions/account.ts` - update portfolio slug (account email/name updates still allowed)

**What super_admin CAN still do**:
- ✅ View portfolios (public view)
- ✅ Impersonate users (read-only mode)
- ✅ Toggle portfolio publish/unpublish status
- ✅ Create/delete users
- ✅ Update their own account email/name (not portfolio-specific)

**What super_admin CANNOT do**:
- ❌ Edit any portfolio content (skills, projects, experience, about, hero, architecture, contact)
- ❌ Upload avatars
- ❌ Change portfolio slugs
- ❌ Create or modify portfolio sections

## PART 3: UI Simplification

**File**: `src/app/admin/layout.tsx`

**Changes**:
- When super_admin is NOT impersonating: Sidebar shows ONLY "Users" link
- When super_admin IS impersonating: Sidebar shows full portfolio management UI (read-only)
- When regular user: Sidebar shows full portfolio management UI (editable)

**Redirects Added** (all portfolio admin pages):
- `/admin` (dashboard) → redirects to `/admin/users` with message
- `/admin/skills` → redirects to `/admin/users` with message
- `/admin/projects` → redirects to `/admin/users` with message
- `/admin/experience` → redirects to `/admin/users` with message
- `/admin/about` → redirects to `/admin/users` with message
- `/admin/hero` → redirects to `/admin/users` with message
- `/admin/architecture` → redirects to `/admin/users` with message
- `/admin/contact` → redirects to `/admin/users` with message
- `/admin/account` → redirects to `/admin/users` with message

**Message**: "Super admin accounts are for platform management only."

## PART 4: Publish/Approval Flow

**Status**: ✅ Already implemented correctly

**Function**: `togglePortfolioPublish()` in `src/app/actions/super-admin.ts`
- Super admin can toggle portfolio publish status
- This is a platform management function (not portfolio content editing)
- No changes needed

## Safety Checks

✅ **No schema changes** - All changes are application-level
✅ **No data deletion** - Migration script only transfers ownership
✅ **No public routing changes** - Public portfolio URLs remain unchanged
✅ **No auth logic changes** - Only added role checks to write operations
✅ **Referential integrity preserved** - Portfolio relationships remain intact

## Migration Checklist

Before deploying:

1. [ ] Run migration script: `npx tsx prisma/migrate-super-admin-portfolio.ts`
2. [ ] Save the new user credentials (email + password)
3. [ ] Verify portfolio data was transferred correctly
4. [ ] Test that super admin can no longer edit portfolio content
5. [ ] Test that super admin can still manage users and toggle publish status
6. [ ] Test that new normal user can log in and edit their portfolio
7. [ ] Verify public portfolio URLs still work

## Post-Migration

After running the migration:

1. **Super admin** should log in and see only the "Users" page
2. **New normal user** should log in with the credentials from the migration script
3. **New normal user** should see full portfolio management UI
4. **Public portfolio** should still be accessible at the same URL

## Notes

- The migration script is idempotent - it checks if a user already owns the portfolio before creating a new one
- Super admin can still impersonate users to view their portfolios in read-only mode
- All portfolio write operations now have two layers of protection:
  1. `assertNotSuperAdminForPortfolioWrite()` - blocks super_admin
  2. `assertNotImpersonatingForWrite()` - blocks writes during impersonation
