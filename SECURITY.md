# Security Guide

This document outlines security best practices for this portfolio application.

## ✅ Security Checklist

### 1. No Passwords in Git

- ✅ `.env` files are ignored via `.gitignore`
- ✅ No hardcoded passwords in source code
- ✅ `.env.example` provides a template without secrets

### 2. Environment Variables

**Local Development:**
- Create `.env` file from `.env.example`
- Set `ADMIN_PASSWORD` to a strong password
- Set `DATABASE_URL` with your local database credentials

**Production (Vercel):**
- Set environment variables in Vercel Dashboard → Settings → Environment Variables
- **Never commit `.env` files**
- Use different passwords for development and production

### 3. Admin Panel Protection

- ✅ Protected by middleware (all `/admin/*` routes require authentication)
- ✅ Cookie-based session (httpOnly, secure in production)
- ✅ Login page at `/admin/login`
- ✅ Session expires after 7 days

**To access admin panel:**
1. Navigate to `/admin/login`
2. Enter password from `ADMIN_PASSWORD` environment variable
3. Session cookie will be set automatically

### 4. Database Security

**Development:**
- Local database (PostgreSQL or SQLite)
- Credentials stored in `.env` (not committed)

**Production:**
- Use managed database (e.g., Vercel Postgres, Supabase, Neon)
- Set `DATABASE_URL` in Vercel environment variables
- **Never commit database credentials**

### 5. Docker (if used)

If you plan to use Docker:
- Use environment variables for secrets (not hardcoded)
- Use Docker secrets for production
- Never commit Dockerfiles with hardcoded passwords

### 6. Production Deployment (Vercel)

**Required Environment Variables in Vercel:**
```
DATABASE_URL=postgresql://user:password@host:port/database
ADMIN_PASSWORD=your-strong-production-password
NODE_ENV=production
```

**Steps:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable (Development, Preview, Production)
3. Deploy - Vercel will inject these at runtime
4. Verify admin login works after deployment

### 7. Repository Safety

**This repository is safe to share publicly because:**
- ✅ No `.env` files committed
- ✅ No hardcoded passwords
- ✅ No database credentials in code
- ✅ `.gitignore` properly configured
- ✅ User-uploaded files (PDFs) are ignored

**Before pushing:**
```bash
# Verify no secrets are tracked
git ls-files | grep -E "\.env|password|secret"

# Should return nothing or only example files
```

### 8. Additional Security Notes

- **Session Security**: Cookies are `httpOnly` (prevents XSS) and `secure` in production (HTTPS only)
- **CSRF Protection**: SameSite cookie policy helps prevent CSRF attacks
- **Password Strength**: Use a strong password (12+ characters, mixed case, numbers, symbols)
- **Regular Updates**: Keep dependencies updated for security patches

## 🔒 Quick Security Audit

Run these checks before deploying:

```bash
# 1. Verify .env is not tracked
git ls-files | grep .env
# Should only show .env.example if anything

# 2. Search for hardcoded passwords
grep -r "password.*=" src/ --exclude-dir=node_modules
# Should not find any hardcoded passwords

# 3. Check for database URLs with passwords
grep -r "postgresql://.*@" src/ --exclude-dir=node_modules
# Should not find any

# 4. Verify .gitignore includes .env
grep "\.env" .gitignore
# Should show .env*
```

## 🚨 If You Accidentally Committed Secrets

If you accidentally committed secrets:

1. **Immediately rotate the secret** (change password, regenerate API keys)
2. **Remove from git history** (requires force push - coordinate with team)
3. **Verify .gitignore** is properly set up
4. **Consider using git-secrets** for future prevention

```bash
# Remove file from history (BE CAREFUL - requires force push)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if you're sure!)
git push origin --force --all
```

## 📝 Environment Variable Template

Copy `.env.example` to `.env` and fill in values:

```env
DATABASE_URL="your-database-url"
ADMIN_PASSWORD="your-strong-password"
NODE_ENV="development"
```

---

**Remember:** Security is an ongoing process. Review and update this guide regularly.
