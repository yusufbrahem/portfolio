import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Architecture & Expertise",
  description:
    "Security, transaction integrity, scalability, and reliability patterns for banking and fintech backend systems.",
};

export const dynamic = "force-dynamic";

export default async function ArchitecturePage() {
  notFound();
}

