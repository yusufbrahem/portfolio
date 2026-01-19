# Youssef Brahem — Portfolio (Next.js)

Production-ready personal portfolio website built with:
- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Lucide React**
- **SEO via `next/metadata`**
- **Deployment target: Vercel**

## Run locally

```bash
npm install
npm run dev
```

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

## Update content later

All copy and structured content is centralized in:

- `src/content/site.ts`

