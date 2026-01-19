import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

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
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased app-bg min-h-dvh`}
      >
        <div className="pointer-events-none fixed inset-0 bg-black/30 [mask-image:radial-gradient(1200px_700px_at_50%_10%,black,transparent)]" />
        <Header />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
