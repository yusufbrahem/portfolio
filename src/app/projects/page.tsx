import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected banking and fintech projects (anonymized) focused on security, transaction processing, and production reliability.",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  notFound();
}

