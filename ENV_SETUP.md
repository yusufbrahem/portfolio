# Environment Variables Setup Guide

This project uses separate environment files for development and production to keep configurations organized and secure.

## Environment File Structure

### Development (Local)
- **`.env.local`** or **`.env.development.local`** - Your local development variables (NOT committed to git)
- **`.env.development.example`** - Template for development (committed to git)

### Production (Vercel)
- **Vercel Dashboard Environment Variables** - Set in Vercel Dashboard → Settings → Environment Variables
- **`.env.production.example`** - Template/documentation for production values (committed to git)

### General Template
- **`.env.example`** - General template (committed to git)

## Next.js Environment File Loading Order

Next.js automatically loads environment files in this priority order (higher priority overrides lower):

1. `.env.local` (always loaded, highest priority)
2. `.env.development.local` or `.env.production.local` (based on NODE_ENV)
3. `.env.development` or `.env.production` (based on NODE_ENV)
4. `.env` (fallback)

**All `.local` files are ignored by git automatically.**

## Setup Instructions

### For Local Development

1. **Copy the development template:**
   ```bash
   cp .env.development.example .env.local
   # OR
   cp .env.development.example .env.development.local
   ```

2. **Edit `.env.local` with your actual values:**
   ```env
   DATABASE_URL="postgresql://postgres:your-password@localhost:5432/portfolio"
   ADMIN_PASSWORD="your-dev-password"
   NODE_ENV="development"
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

### For Production (Vercel)

**Option 1: Vercel Dashboard (Recommended)**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable:
   - `DATABASE_URL` = Your production database URL
   - `ADMIN_PASSWORD` = Your strong production password
   - `NODE_ENV` = `production`
   - `NEXT_PUBLIC_SITE_URL` = Your production domain

**Option 2: Vercel CLI**
```bash
vercel env add DATABASE_URL
vercel env add ADMIN_PASSWORD
vercel env add NODE_ENV
```

## Environment Variables Reference

### Required Variables

| Variable | Development | Production | Description |
|----------|------------|------------|-------------|
| `DATABASE_URL` | ✅ Required | ✅ Required | PostgreSQL connection string |
| `ADMIN_PASSWORD` | ✅ Required | ✅ Required | Admin panel password (use different passwords!) |
| `NODE_ENV` | `development` | `production` | Node.js environment |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Your site URL (used for metadata, links) |

## Security Best Practices

1. **Never commit actual `.env` files** - Only commit `.example` files
2. **Use different passwords** for development and production
3. **Use strong passwords** in production (12+ characters, mixed case, numbers, symbols)
4. **Rotate passwords** if they're ever exposed
5. **Review `.gitignore`** regularly to ensure env files are ignored

## File Naming Conventions

- **`.env.local`** - Local overrides (highest priority, ignored by git)
- **`.env.development.local`** - Development-specific local overrides
- **`.env.production.local`** - Production-specific local overrides (rarely used)
- **`.env.development`** - Development defaults (can be committed if no secrets)
- **`.env.production`** - Production defaults (usually not used, use Vercel env vars)
- **`.env`** - General defaults (fallback)

## Troubleshooting

### "Environment variable not set" error

1. Check that your `.env.local` file exists
2. Verify the variable name matches exactly (case-sensitive)
3. Restart your development server after changing `.env` files
4. Check that `.env.local` is in the project root (same level as `package.json`)

### Production environment variables not working

1. Verify variables are set in Vercel Dashboard
2. Check that environment is set to "Production" (not Preview)
3. Redeploy after adding/changing variables
4. Check Vercel build logs for errors

### Different values for different environments

Use Vercel's environment targeting:
- **Production** - For production deployments
- **Preview** - For pull request previews
- **Development** - For local development (uses `.env.local`)

## Quick Start

```bash
# 1. Copy development template
cp .env.development.example .env.local

# 2. Edit with your values
# (edit .env.local with your actual database URL and password)

# 3. Start development
npm run dev
```

---

**Remember:** Never commit `.env.local`, `.env.development.local`, or any file with actual secrets!
