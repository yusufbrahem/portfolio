import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";
import { validateRequiredEnv } from "@/lib/env";

// Validate required env vars at startup
validateRequiredEnv();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://folio.dev",
  ),
  title: {
    default: "Folio — Create and share your professional portfolio",
    template: "%s — Folio",
  },
  description:
    "Create and share your professional portfolio. Build a beautiful, customizable portfolio to showcase your work, skills, and experience. No coding required.",
  applicationName: "Folio",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Folio — Create and share your professional portfolio",
    description:
      "Create and share your professional portfolio. Build a beautiful, customizable portfolio to showcase your work, skills, and experience.",
    url: "/",
    siteName: "Folio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Folio — Create and share your professional portfolio",
    description:
      "Create and share your professional portfolio. Build a beautiful, customizable portfolio to showcase your work, skills, and experience.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "Technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fail fast at runtime if required secrets are missing (server-side only).
  validateRequiredEnv();

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh`}
      >
        <Providers>
          <Header />
          <main className="relative">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
