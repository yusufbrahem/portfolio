import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "About",
  description:
    "Professional narrative and engineering principles focused on secure banking platforms, identity, and transaction integrity.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  notFound();
}

