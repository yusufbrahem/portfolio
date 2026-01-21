import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact details: email, LinkedIn, and location.",
};

export default async function ContactPage() {
  notFound();
}

