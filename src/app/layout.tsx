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
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://youssef-brahem.vercel.app",
  ),
  title: {
    default: "Youssef Brahem — Senior Backend & Fintech Engineer",
    template: "%s — Youssef Brahem",
  },
  description:
    "Senior Backend Engineer (banking & fintech). Java, Spring Boot, secure REST APIs, OAuth2/OIDC, Keycloak, transaction processing, payment systems, and scalable banking platforms.",
  applicationName: "Youssef Brahem Portfolio",
  authors: [{ name: "Youssef Brahem" }],
  creator: "Youssef Brahem",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Youssef Brahem — Senior Backend & Fintech Engineer",
    description:
      "Senior Backend Engineer (banking & fintech). Java, Spring Boot, OAuth2/OIDC, Keycloak, transaction processing, payment systems, and scalable banking platforms.",
    url: "/",
    siteName: "Youssef Brahem",
  },
  twitter: {
    card: "summary_large_image",
    title: "Youssef Brahem — Senior Backend & Fintech Engineer",
    description:
      "Senior Backend Engineer (banking & fintech). Java, Spring Boot, OAuth2/OIDC, Keycloak, transaction processing, payment systems, and scalable banking platforms.",
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
