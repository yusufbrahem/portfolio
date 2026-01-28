# NextAuth.js Authentication Setup

This project uses **NextAuth.js (Auth.js)** with Credentials Provider for secure, database-backed authentication.

---

## 🔐 Authentication Architecture

### Session Strategy: JWT

We use **JWT (JSON Web Tokens)** for sessions because:
- ✅ Stateless - no database queries on every request
- ✅ Fast - session validation is instant
- ✅ Scalable - works well with serverless/horizontal scaling
- ✅ Secure - tokens are signed and encrypted

**Alternative:** Database sessions are available but require a Session table and DB queries on every request.

---

## 🔑 Secrets & Environment Variables

### Required Environment Variables

All secrets are loaded **only from environment variables** - no hardcoded values.

#### Development (`.env.local`)

```env
# Database
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/portfolio"

# NextAuth.js Secret (REQUIRED)
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-random-secret-key-here-minimum-32-characters"

# Optional: Admin user seed (dev only)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
```

#### Production (Vercel Environment Variables)

Set these in **Vercel Dashboard → Settings → Environment Variables**:

1. `DATABASE_URL` - Your production database connection string
2. `AUTH_SECRET` - A strong random secret (generate with `openssl rand -base64 32`)

**⚠️ Important:** Never commit `.env.local` or expose `AUTH_SECRET` publicly!

---

## 📍 Where Secrets Live

### 1. **AUTH_SECRET** (NextAuth.js)

**Location:** `.env.local` (development) or Vercel Environment Variables (production)

**Purpose:** 
- Signs and encrypts JWT tokens
- Validates session cookies
- Prevents token tampering

**Generation:**
```bash
# Generate a secure random secret
openssl rand -base64 32
```

**Security:**
- Minimum 32 characters recommended
- Must be kept secret (never commit to git)
- Different values for dev/production

### 2. **DATABASE_URL** (Prisma)

**Location:** `.env.local` (development) or Vercel Environment Variables (production)

**Purpose:**
- Database connection string
- Used by Prisma to connect to PostgreSQL

**Format:**
```
postgresql://user:password@host:port/database
```

### 3. **Password Hashes** (Database)

**Location:** `AdminUser.passwordHash` column in database

**Purpose:**
- Stores bcrypt-hashed passwords
- Never stores plain text passwords

**Security:**
- bcrypt with 12 salt rounds
- One-way hashing (cannot be reversed)
- Timing attack protection

---

## 👤 Adding a New User

### Method 1: Seed Script (Development Only)

```bash
# Set credentials in .env.local
ADMIN_EMAIL="newuser@example.com"
ADMIN_PASSWORD="secure-password-123"

# Run seed script
npm run db:seed-auth
```

**⚠️ Warning:** This script only works in development (`NODE_ENV !== "production"`)

### Method 2: Manual Database Insert (Not Recommended)

```typescript
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const email = "user@example.com";
const password = "secure-password";
const passwordHash = await bcrypt.hash(password, 12);

await prisma.adminUser.create({
  data: {
    email,
    passwordHash,
    name: "User Name",
  },
});
```

### Method 3: Admin Interface (Future Enhancement)

Create an admin interface for user management (recommended for production).

---

## 🛡️ Security Features

### Password Security

1. **Hashing:** bcrypt with 12 salt rounds
2. **Timing Attack Protection:** Always hash (even for non-existent users)
3. **No Plain Text:** Passwords never stored in plain text

### Session Security

1. **HTTPOnly Cookies:** Prevents XSS attacks
2. **Secure Cookies:** HTTPS only in production
3. **SameSite:** Lax (CSRF protection)
4. **JWT Signing:** Tokens signed with AUTH_SECRET

### Route Protection

1. **Middleware:** Protects `/admin/*` routes
2. **Server Actions:** All write operations require auth
3. **Layout Check:** Defense-in-depth verification

---

## 🔄 Authentication Flow

### Login Flow

```
1. User submits email + password
   ↓
2. NextAuth Credentials Provider
   ↓
3. Query database for user by email
   ↓
4. Compare password with bcrypt.compare()
   ↓
5. If valid → Create JWT session
   ↓
6. Set httpOnly cookie
   ↓
7. Redirect to /admin
```

### Request Flow

```
1. Request to /admin/*
   ↓
2. Middleware checks session
   ↓
3. If no session → Redirect to /admin/login
   ↓
4. If session valid → Allow access
   ↓
5. Server components can use auth() to get user
```

---

## 📝 Usage Examples

### Server Component

```typescript
import { auth } from "@/auth";

export default async function AdminPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/admin/login");
  }
  
  return <div>Welcome, {session.user.email}!</div>;
}
```

### Server Action

```typescript
"use server";

import { requireAuth } from "@/lib/auth";

export async function updateContent() {
  await requireAuth(); // Throws if not authenticated
  
  // Your code here
}
```

### Client Component

```typescript
"use client";

import { useSession } from "next-auth/react";

export function UserInfo() {
  const { data: session } = useSession();
  
  if (!session) return null;
  
  return <div>{session.user.email}</div>;
}
```

---

## 🚀 Initial Setup

### 1. Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

### 2. Add to `.env.local`

```env
AUTH_SECRET="your-generated-secret-here"
DATABASE_URL="postgresql://..."
```

### 3. Run Database Migration

```bash
npm run db:migrate
```

### 4. Seed Admin User

```bash
npm run db:seed-auth
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Login

Navigate to `/admin/login` and use the credentials from step 4.

---

## 🔍 Troubleshooting

### "AUTH_SECRET is not set"

**Solution:** Add `AUTH_SECRET` to `.env.local` or environment variables.

### "Invalid credentials"

**Solution:** 
- Check email exists in database
- Verify password hash is correct
- Try resetting password with seed script

### Session not persisting

**Solution:**
- Check cookies are enabled in browser
- Verify `AUTH_SECRET` is set correctly
- Check middleware is not blocking cookies

### "Password authentication failed"

**Solution:**
- Ensure password is hashed with bcrypt
- Verify salt rounds match (12)
- Check database connection

---

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcryptjs)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## ✅ Security Checklist

- [x] Passwords hashed with bcrypt
- [x] AUTH_SECRET loaded from env only
- [x] No hardcoded secrets
- [x] HTTPOnly cookies
- [x] Secure cookies in production
- [x] Server-side session validation
- [x] No client-side auth logic
- [x] Timing attack protection
- [x] Route protection via middleware
- [x] Defense-in-depth checks
