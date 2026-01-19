# Portfolio CMS - Admin Documentation

## Overview

This portfolio has been upgraded from a static site to a **configurable CMS-like system** with a secure admin panel. All portfolio content (Skills, Projects, Experience, About) can now be managed through a web interface without touching code.

## Architecture

- **Database**: SQLite (file-based, easy to backup)
- **ORM**: Prisma 7
- **Admin Auth**: Cookie-based session (password protected)
- **Data Layer**: Server actions for all CRUD operations

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

Create/update `.env` file:

```env
DATABASE_URL="file:./dev.db"
ADMIN_PASSWORD="your-secure-password-here"
```

**IMPORTANT**: Change `ADMIN_PASSWORD` to a strong password before deploying!

### 3. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (populates from src/content/site.ts)
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

## Admin Panel Access

1. Navigate to `/admin/login`
2. Enter the password set in `ADMIN_PASSWORD` environment variable
3. You'll be redirected to `/admin` dashboard

## Admin Features

### Dashboard (`/admin`)
- Overview of content counts
- Quick navigation to all sections

### Skills Management (`/admin/skills`)
- **Add Skill Groups**: Click "Add Group", enter name
- **Edit Groups**: Click edit icon, modify name inline
- **Delete Groups**: Click delete icon (removes group and all skills)
- **Add Skills**: Expand a group, click "Add Skill"
- **Edit Skills**: Click edit icon next to skill name
- **Delete Skills**: Click delete icon next to skill

### Projects Management (`/admin/projects`)
- **Add Project**: Click "Add Project", fill form:
  - Title
  - Summary
  - Bullets (click + to add more)
  - Tags (click + to add more)
- **Edit Project**: Click edit icon, modify form
- **Delete Project**: Click delete icon

### Experience Management (`/admin/experience`)
- **Add Experience**: Click "Add Experience", fill form:
  - Title (e.g., "Senior Backend Engineer")
  - Company
  - Location
  - Period (e.g., "Current" or "2020-2023")
  - Bullets (achievements/responsibilities)
  - Tech (technologies used)
- **Edit Experience**: Click edit icon
- **Delete Experience**: Click delete icon

## Data Structure

### Skills
- Organized into **Groups** (e.g., "Backend & Platforms")
- Each group contains multiple **Skills** (e.g., "Java", "Spring Boot")
- Ordering supported via `order` field

### Projects
- Each project has:
  - Title
  - Summary (description)
  - Bullets (array of achievement points)
  - Tags (array of technology tags)
- Ordering supported

### Experience
- Each entry has:
  - Title (role)
  - Company
  - Location
  - Period
  - Bullets (responsibilities/achievements)
  - Tech (technologies used)
- Ordering supported

## Public Pages

All public pages (`/`, `/skills`, `/projects`, `/experience`, `/about`, `/resume`) now read dynamically from the database. Changes made in admin panel reflect immediately.

## Security Notes

1. **Admin Password**: Stored in `ADMIN_PASSWORD` environment variable
2. **Session**: Cookie-based, expires after 7 days
3. **Admin Routes**: Protected by middleware - redirects to login if not authenticated
4. **Production**: Ensure `ADMIN_PASSWORD` is set securely, never commit to git

## Database Backup

The database is a single SQLite file: `dev.db` (or path specified in `DATABASE_URL`)

To backup:
```bash
cp dev.db dev.db.backup
```

To restore:
```bash
cp dev.db.backup dev.db
```

## Deployment

### Vercel / Production

1. Set `DATABASE_URL` environment variable (can use same SQLite file or migrate to PostgreSQL)
2. Set `ADMIN_PASSWORD` to a strong password
3. Run migrations: `npm run db:migrate`
4. Seed initial data: `npm run db:seed` (optional, if starting fresh)

### Database File

For SQLite, the database file needs to be persisted. Options:
- Use Vercel's file system (temporary, resets on deploy)
- Use a cloud SQLite service
- Migrate to PostgreSQL for production (recommended)

## Troubleshooting

### Prisma Client Issues

If you see Prisma adapter errors:
1. Ensure `@prisma/adapter-libsql` and `@libsql/client` are installed
2. Run `npm run db:generate` to regenerate Prisma Client
3. Check that `DATABASE_URL` is set correctly

### Admin Login Not Working

1. Verify `ADMIN_PASSWORD` is set in `.env`
2. Clear browser cookies for the site
3. Check server logs for errors

### Data Not Showing

1. Ensure database is seeded: `npm run db:seed`
2. Check that migrations ran: `npm run db:migrate`
3. Verify database file exists at path in `DATABASE_URL`

## Next Steps / Future Enhancements

- [ ] Add About page content management (`/admin/about`)
- [ ] Add Hero content management (`/admin/hero`)
- [ ] Add Person info management (`/admin/person`)
- [ ] Add drag-and-drop reordering for items
- [ ] Add bulk operations (delete multiple, reorder)
- [ ] Add export/import functionality
- [ ] Migrate to PostgreSQL for production scalability

## File Structure

```
src/
  app/
    admin/              # Admin panel routes
      login/           # Login page
      skills/          # Skills management
      projects/        # Projects management
      experience/      # Experience management
    actions/           # Server actions (CRUD)
      skills.ts
      projects.ts
      experience.ts
  lib/
    prisma.ts         # Prisma client singleton
    auth.ts           # Authentication helpers
    data.ts           # Public data access functions
  components/
    admin/            # Admin UI components
prisma/
  schema.prisma       # Database schema
  seed.ts            # Seed script
```

## Support

For issues or questions, check:
1. Prisma documentation: https://www.prisma.io/docs
2. Next.js App Router docs: https://nextjs.org/docs/app
3. Database file location and permissions
