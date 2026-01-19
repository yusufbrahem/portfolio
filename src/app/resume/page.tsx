import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Section } from "@/components/section";
import { Card, Pill, PrimaryButton, SecondaryButton } from "@/components/ui";
import { getPersonInfo, getExperience, getSkills, getProjects } from "@/lib/data";
import { ResumeActions } from "@/app/resume/resume-actions";
import { Download } from "lucide-react";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Resume page formatted for PDF export (print-to-PDF). Includes experience focus areas, skills, and project highlights.",
};

export default async function ResumePage() {
  const person = await getPersonInfo();
  const experience = await getExperience();
  const skills = await getSkills();
  const projects = await getProjects();

  return (
    <Container>
      <Section
        eyebrow="Resume"
        title="Resume (PDF-ready)"
        description="This page is designed to export cleanly to PDF using your browser's Print → Save as PDF."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <PrimaryButton href="/contact">
              Contact
            </PrimaryButton>
            <SecondaryButton href={person.linkedIn}>LinkedIn</SecondaryButton>
            {person.cvUrl && (
              <a
                href={person.cvUrl}
                download
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border bg-panel text-foreground rounded-lg hover:bg-panel2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download CV
              </a>
            )}
          </div>
          <ResumeActions />
        </div>

        <Motion>
          <Card className="mt-6 p-8 print:border-0 print:bg-white print:p-0 print:shadow-none">
            <div className="space-y-8 print:text-black">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground print:!text-black">
                  {person.name}
                </h2>
                <p className="text-sm leading-relaxed text-muted print:!text-black">
                  {person.role} • {person.location}
                </p>
                <p className="text-sm leading-relaxed text-muted print:!text-black">
                  <a className="hover:underline print:!text-black print:no-underline" href={`mailto:${person.email}`}>
                    {person.email}
                  </a>{" "}
                  •{" "}
                  <a
                    className="hover:underline print:!text-black print:no-underline"
                    href={person.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {person.linkedIn}
                  </a>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-muted print:!text-black">
                  Senior Backend Engineer with 5+ years in banking and fintech. Specialized in Java,
                  Spring Boot, secure REST APIs, OAuth2/OpenID Connect, Keycloak, transaction processing,
                  and payment systems for large-scale mobile and digital banking platforms.
                </p>
                <div className="flex flex-wrap gap-2 print:hidden">
                  {["Java", "Spring Boot", "OAuth2/OIDC", "Keycloak", "Transactions", "Payments"].map(
                    (x) => (
                      <Pill key={x}>{x}</Pill>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold tracking-[0.2em] text-foreground uppercase print:!text-black">
                  Experience
                </h3>
                <div className="space-y-5">
                  {experience.roles.map((r) => (
                    <div key={`${r.title}-${r.company}`} className="space-y-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground print:!text-black">
                          {r.title}
                        </p>
                        <p className="text-sm leading-relaxed text-muted print:!text-black">
                          {r.company} • {r.location} • {r.period}
                        </p>
                      </div>
                      <ul className="space-y-1 text-sm leading-relaxed text-muted print:!text-black">
                        {r.bullets.map((b, idx) => (
                          <li key={idx}>- {b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold tracking-[0.2em] text-foreground uppercase print:!text-black">
                  Skills
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {skills.map((g) => (
                    <div key={g.group} className="space-y-2">
                      <p className="text-sm font-semibold text-foreground print:!text-black">
                        {g.group}
                      </p>
                      <p className="text-sm leading-relaxed text-muted print:!text-black">
                        {g.items.join(" • ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold tracking-[0.2em] text-foreground uppercase print:!text-black">
                  Selected work (anonymized)
                </h3>
                <div className="space-y-4">
                  {projects.map((p) => (
                    <div key={p.title} className="space-y-1">
                      <p className="text-sm font-semibold text-foreground print:!text-black">
                        {p.title}
                      </p>
                      <p className="text-sm leading-relaxed text-muted print:!text-black">{p.summary}</p>
                      <ul className="mt-1 space-y-1 text-sm leading-relaxed text-muted print:!text-black">
                        {p.bullets.map((b, idx) => (
                          <li key={idx}>- {b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Motion>
      </Section>
    </Container>
  );
}

