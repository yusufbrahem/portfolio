import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Section } from "@/components/section";
import { Card, Pill } from "@/components/ui";
import { getSkills } from "@/lib/data";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Skills grouped by backend engineering, security/identity, databases, and architecture/operations for banking-grade systems.",
};

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const skills = await getSkills();

  return (
    <Container>
      <Section
        eyebrow="Skills"
        title="Senior backend toolkit for regulated fintech environments"
        description="A practical, production-focused skill set spanning secure APIs, identity governance, and transaction-grade persistence."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {skills.map((group, idx) => (
            <Motion key={group.group} delay={idx * 0.05}>
              <Card className="p-6">
                <p className="text-sm font-semibold text-foreground">
                  {group.group}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((s) => (
                    <Pill key={s}>{s}</Pill>
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

