# Portfolio Platform — Project Context

## Tech Stack
- Next.js (App Router)
- TypeScript
- Prisma (PostgreSQL)
- Auth.js / NextAuth (Credentials)
- Tailwind CSS
- Vitest (integration tests)
- GitHub Actions CI

## Architecture Summary
- Multi-portfolio platform
- Roles:
  - super_admin (platform-level)
  - user (portfolio owner)
- Each user owns exactly one Portfolio
- Public portfolios live under: /portfolio/:slug
- Admin under: /admin/*

## Menu System
- Platform menus defined by super admin
- Portfolio owners can:
  - enable / disable menus
  - reorder menus
  - hide/show sections & items
- Default menus must NEVER lose data
- Menu edits must be non-destructive

## Data Safety Rules (CRITICAL)
- Editing menus must NOT delete data
- Disabling sections/items hides them only
- Re-enabling restores original data
- Public portfolio must never leak draft/unpublished data

## Testing
- Vitest integration tests exist for:
  - menu edits not deleting skills
  - section visibility safety
  - menu reorder safety
  - public portfolio layout safety
- Tests skip DB in CI using dummy DATABASE_URL

## CI
- GitHub Actions
- Lint → Typecheck → Tests → Prisma validate → Build
- Dummy DATABASE_URL in CI
- Green pipeline required

## Current Status
- Platform stabilized
- Tests passing
- Tagged stable versions exist
- Next planned feature: Global Draft / Preview / Publish system (NOT IMPLEMENTED YET)
