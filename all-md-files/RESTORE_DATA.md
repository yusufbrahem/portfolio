# Restoring Lost Data

If menu or section data disappeared after editing a menu or running "Restore default components", use these options in order.

---

## Recovering user/section data (Skills, Projects, Experience, etc.)

**If skills, projects, experience, about, architecture, or contact data was deleted**, that data lives only in the database. It can **only** be recovered by restoring from a **database backup** (full dump or point-in-time restore). The app does not keep a separate copy of this content.

### Option A: You have a backup file (e.g. `backup.sql` or `backup.dump`)

1. Stop the app (or put it in read-only) so nothing overwrites the restored data.
2. Restore the backup:
   - **Plain SQL (e.g. from `pg_dump` without `-F c`):**
     ```bash
     psql "$env:DATABASE_URL" -f backup.sql
     ```
     Or on Windows PowerShell (after loading your `.env` or setting `$env:DATABASE_URL`):
     ```powershell
     Get-Content .env.local | ForEach-Object { if ($_ -match '^DATABASE_URL=(.+)$') { $env:DATABASE_URL = $matches[1].Trim('"') } }
     psql $env:DATABASE_URL -f backup.sql
     ```
   - **Custom format (e.g. `pg_dump -F c`):**
     ```bash
     pg_restore -d "$DATABASE_URL" --clean --if-exists backup.dump
     ```
3. Run migrations if needed: `npm run db:migrate`
4. Restart the app and check Admin → Skills, Projects, etc.

### Option B: Managed database (Neon, Supabase, Vercel Postgres, Railway, RDS, etc.)

1. Open the provider’s dashboard.
2. Find **Backups** or **Point-in-time recovery**.
3. Restore to a point in time **before** the data was lost (or restore from a snapshot).
4. If the provider creates a **new** database/URL with the restore, update your app’s `DATABASE_URL` to that new URL.
5. Run migrations if needed: `npm run db:migrate`
6. Restart the app.

### Option C: Local PostgreSQL in Docker (this project’s `docker-compose`)

If you use `docker-compose` and the DB has no backup, the data is only on the container/volume:

- If the container (and volume) still exist and were not recreated, the data may still be there — check Admin → Skills / Projects. If the tables are empty, the data was already removed (e.g. by a restore or another action).
- To **restore** from a backup file you had taken earlier:
  ```powershell
  Get-Content .env.local | ForEach-Object { if ($_ -match '^DATABASE_URL=(.+)$') { $env:DATABASE_URL = $matches[1].Trim('"') } }
  psql $env:DATABASE_URL -f backup.sql
  ```
  Or with Docker:
  ```powershell
  docker exec -i portfolio-db psql -U postgres -d portfolio < backup.sql
  ```

### Data still in DB but not showing per user

If the data **is still in the database** but not visible for users (e.g. after menu IDs or links changed), run the restore script to re-link all section content to the current platform menus and ensure each portfolio has menu entries:

```bash
npm run db:restore-section-data
```

This updates all SkillGroup, Experience, Project, AboutContent, ArchitectureContent, and PersonInfo rows to use the current platform menu IDs (skills, experience, projects, about, architecture, contact) and ensures every portfolio has a PortfolioMenu for each section so the section appears for that user.

### If you have no backup

- **Skills, Projects, Experience, About, Architecture, Contact** content that was deleted **cannot** be recovered without a backup.
- Re-enter data in Admin (Skills, Projects, Experience, About, Architecture, Contact) or re-run any seed scripts you use for demo users (e.g. `npm run db:seed-users` for demo data only).
- Going forward: run **backups regularly** (see “Prevent future loss” and the backup script below).

---

## 1. Recover hidden blocks (menu structure only — try this first)

**When it helps:** Data was only *hidden*, not deleted. Blocks that were removed from the component list are stored with a high `order` value and not shown until recovered.

**Steps:**

1. Log in as **super admin**.
2. Go to **Admin → Platform Menus**.
3. Click **"Recover hidden blocks"**.
4. If any hidden blocks exist, they will be re-added to their menus and visible again with data intact.
5. If you see *"No hidden blocks found"*, the blocks were actually deleted — use option 2.

---

## 2. Restore from a database backup

**When it helps:** Blocks or section content (skills, experience, projects, etc.) were **deleted** from the database. Only a backup can bring them back.

### If you use PostgreSQL (local or self‑hosted)

**Restore a full database backup (e.g. from `pg_dump`):**

```bash
# Stop the app if it uses the DB
# Restore (replace backup.sql and DATABASE_URL with your values)
psql "$DATABASE_URL" < backup.sql
```

Or drop and recreate the DB, then restore:

```bash
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "$DATABASE_URL" < backup.sql
```

**Point-in-time recovery (if you have WAL archiving):**

- Restore a base backup, then replay WAL up to the desired time. See [PostgreSQL PITR](https://www.postgresql.org/docs/current/continuous-archiving.html).

### If you use a managed database

- **Vercel Postgres / Neon / Supabase / Railway / RDS, etc.:** Use the provider’s backup or point-in-time restore from the dashboard.
- Restore to a new instance or to the same instance to the chosen time **before** the data loss.

### After restoring from backup

1. Run migrations if your app version expects new tables/columns:  
   `npm run db:migrate`
2. Restart the app and verify data in the admin and on the public site.

---

## 3. What was lost (if no backup)

If there is **no backup** and blocks were **deleted** (not only hidden):

- **Menu blocks** (titles, rich text, pill list, file/link entries, etc. stored in `MenuBlock.data`): **cannot be recovered.** Re-enter them in Admin → Menus (per section).
- **Section content** (Skills, Experience, Projects, About, Architecture, Contact) lives in tables like `SkillGroup`, `Skill`, `Experience`, `Project`, etc. Those were **not** deleted by menu edits; only menu blocks could be removed. If that content is missing, it was likely removed by something else or never seeded — in that case it also has to be re-entered or re-seeded.

---

## 4. Prevent future loss

1. **Run backups regularly** (daily recommended):
   - Use the project script: `npm run db:backup` (writes to `scripts/backups/`; requires `pg_dump` or Docker with Postgres).
   - Or use your database provider’s automated backups (Neon, Supabase, Vercel Postgres, etc.).
2. **Use "Recover hidden blocks"** first whenever something disappears after a menu change.
3. **Avoid overwriting** component lists: the app now merges and hides instead of deleting; keep that behavior and don’t run old code that deletes blocks.

---

## Quick reference

| Situation | Action |
|----------|--------|
| Data disappeared after menu edit / restore | 1) **Recover hidden blocks** (Admin → Platform Menus). 2) If nothing found, restore from DB backup. |
| No backup, blocks were deleted | Re-enter block content in Admin → Menus (each section). |
| Skills / Experience / Projects etc. missing | Restore from a **database backup** (see “Recovering user/section data” above). If no backup, re-enter in Admin or re-seed. |
