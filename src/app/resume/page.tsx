import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Resume page formatted for PDF export (print-to-PDF). Includes experience focus areas, skills, and project highlights.",
};

export default async function ResumePage() {
  notFound();
}

