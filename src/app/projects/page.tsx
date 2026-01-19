import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Section } from "@/components/section";
import { Card, Pill } from "@/components/ui";
import { getProjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected banking and fintech projects (anonymized) focused on security, transaction processing, and production reliability.",
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <Container>
      <Section
        eyebrow="Projects"
        title="Banking-grade delivery, anonymized with measurable relevance"
        description="Examples of the systems and patterns I've shipped in regulated environments—identity, transactions, and operational resilience."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {projects.map((p, idx) => (
            <Motion key={p.title} delay={idx * 0.05}>
              <Card className="flex h-full flex-col p-6">
                <div className="space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    {p.title}
                  </p>
                  <p className="text-sm leading-relaxed text-muted">{p.summary}</p>
                </div>

                <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <Pill key={t}>{t}</Pill>
                  ))}
                </div>
              </Card>
            </Motion>
          ))}
        </div>
      </Section>
    </Container>
  );
}

