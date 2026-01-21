import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Skills grouped by backend engineering, security/identity, databases, and architecture/operations for banking-grade systems.",
};

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  notFound();
}

