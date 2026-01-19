import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Section } from "@/components/section";
import { Card, Pill } from "@/components/ui";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Experience delivering secure backend services for banking and fintech, with identity, transaction integrity, and operational readiness.",
};

export default function ExperiencePage() {
  return (
    <Container>
      <Section
        eyebrow="Experience"
        title="Banking and fintech delivery—security, transactions, reliability"
        description={site.experience.intro}
      >
        <div className="space-y-6">
          {site.experience.roles.map((role, idx) => (
            <Motion key={`${role.title}-${role.company}`} delay={idx * 0.05}>
              <Card className="p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {role.title}
                    </p>
                    <p className="text-sm text-muted">{role.company}</p>
                    <p className="mt-1 text-xs text-muted-disabled">
                      {role.location} • {role.period}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.tech.map((t) => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
                  {role.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{b}</span>
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

