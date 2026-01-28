# Youssef Brahem — Portfolio (Next.js)

Production-ready personal portfolio website built with:
- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide React**
- **SEO via `next/metadata`**
- **Deployment target: Vercel**

## Run locally

### Option 1: With Docker Compose (Recommended)

1. **Start PostgreSQL database:**
   ```bash
   docker-compose up -d
   ```

2. **Set up environment variables:**
   ```bash
   # Copy development template
   cp .env.development.example .env.local
   
   # Edit .env.local with your values:
   # DATABASE_URL="postgresql://postgres:admin123@localhost:5432/portfolio"
   # AUTH_SECRET="generate-with-openssl-rand-base64-32"
   # ADMIN_EMAIL="admin@example.com" (optional, for seed script)
   # ADMIN_PASSWORD="your-dev-password" (optional, for seed script)
   ```

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development server:**
   ```bash
   npm install
   npm run dev
   ```

5. **Stop database when done:**
   ```bash
   docker-compose down
   ```

### Option 2: Without Docker

If you have PostgreSQL installed locally:

1. Create a database named `portfolio`
2. Set up your `.env.local` file with your local database connection string
3. Run migrations and start the dev server

Open `http://localhost:3000`.

## Build for production

```bash
npm run build
npm run start
```

## Deploy to Vercel

- Push this repo to GitHub.
- In Vercel: **New Project → Import** the repo.
- Framework preset: **Next.js**
- Add environment variable (recommended):
  - **`NEXT_PUBLIC_SITE_URL`** = your production URL (e.g. `https://your-domain.com`)
- Deploy.

## Resume PDF (print-to-PDF)

This project provides a **PDF-ready resume page** at `/resume`.

- Open `/resume`
- Click **Print / Save as PDF**
- Choose **Save as PDF** in your browser’s print dialog

## Add your profile photo

To display your photo in the hero section:

1. Save your headshot image as `public/profile.png`
2. Recommended: Square aspect ratio (e.g., 600x600px or 800x800px)
3. Format: PNG or JPG (PNG preferred for transparency)
4. The photo will automatically appear in the hero section on the home page

If the photo file is missing, a placeholder icon will be shown instead.

## Admin Panel & CMS

This portfolio includes a **configurable CMS system** with an admin panel:

- **Admin Access**: Navigate to `/admin/login` (password protected)
- **Content Management**: Edit Skills, Projects, Experience, About, Architecture, and Contact details via web UI
- **Setup**: See [README_ADMIN.md](./README_ADMIN.md) for detailed setup instructions
- **Security**: See [SECURITY.md](./SECURITY.md) for security best practices and deployment guide

**Quick Setup:**

1. **Start database (if using Docker Compose):**
   ```bash
   docker-compose up -d
   ```

2. **Create your local env file:**
   ```bash
   cp .env.development.example .env.local
   ```
   Then edit `.env.local` with your actual values:
   - `DATABASE_URL="postgresql://postgres:admin123@localhost:5432/portfolio"` (for Docker)
   - `AUTH_SECRET="generate-with-openssl-rand-base64-32"`
   - `ADMIN_EMAIL="admin@example.com"` (optional, for seed script)
   - `ADMIN_PASSWORD="your-secure-password"` (optional, for seed script)

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Access admin panel:**
   Navigate to `/admin/login` and use the email/password from the seed script

## Environment variables (required)

These are **required at runtime** (the app will fail fast if missing):

- **`DATABASE_URL`**: PostgreSQL connection string (server-side only)
- **`AUTH_SECRET`**: NextAuth.js secret for signing JWT tokens (generate with `openssl rand -base64 32`)

Optional:

- **`NEXT_PUBLIC_SITE_URL`**: Used for metadata/sitemap/robots. Public value (not a secret).

## Security

**✅ This repository is safe to share publicly:**
- No passwords in source code
- No `.env` files committed
- All secrets stored in environment variables
- Admin routes protected by middleware
- See [SECURITY.md](./SECURITY.md) for complete security guide

## Update content later

All copy and structured content is centralized in:

- `src/content/site.ts` (legacy - now managed via admin panel)
- Admin panel at `/admin` (recommended)

