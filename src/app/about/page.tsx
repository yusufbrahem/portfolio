import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Section } from "@/components/section";
import { Card } from "@/components/ui";
import { getAboutContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description:
    "Professional narrative and engineering principles focused on secure banking platforms, identity, and transaction integrity.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const about = await getAboutContent();

  return (
    <Container>
      <Section
        eyebrow="About"
        title={about.title}
        description={about.paragraphs[0]}
      >
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            {about.paragraphs.slice(1).map((p: string, idx: number) => (
              <Motion key={idx}>
                <p className="text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">{p}</p>
              </Motion>
            ))}
          </div>
          <div className="lg:col-span-5">
            <div className="grid gap-4">
              {about.principles.map((x, idx) => (
                <Motion key={x.title} delay={idx * 0.05}>
                  <Card className="p-5">
                    <p className="text-sm font-semibold text-foreground">
                      {x.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {x.description}
                    </p>
                  </Card>
                </Motion>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </Container>
  );
}

