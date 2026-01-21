import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Experience delivering secure backend services for banking and fintech, with identity, transaction integrity, and operational readiness.",
};

export const dynamic = "force-dynamic";

export default async function ExperiencePage() {
  notFound();
}

