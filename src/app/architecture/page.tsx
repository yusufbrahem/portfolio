import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Section } from "@/components/section";
import { Card } from "@/components/ui";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Architecture & Expertise",
  description:
    "Security, transaction integrity, scalability, and reliability patterns for banking and fintech backend systems.",
};

export default function ArchitecturePage() {
  return (
    <Container>
      <Section
        eyebrow="Architecture"
        title="Security, transactions, and scalability—built for regulated environments"
        description="A concise view of the patterns I apply to reduce risk and keep systems predictable under load."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {site.architecture.pillars.map((p, idx) => (
            <Motion key={p.title} delay={idx * 0.05}>
              <Card className="h-full p-6">
                <p className="text-base font-semibold text-foreground">
                  {p.title}
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                  {p.points.map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Motion>
          ))}
        </div>
      </Section>
    </Container>
  );
}

