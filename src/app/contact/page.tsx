import type { Metadata } from "next";
import { Mail, MapPin, Linkedin } from "lucide-react";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Section } from "@/components/section";
import { Card, PrimaryButton } from "@/components/ui";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact details: email, LinkedIn, and location.",
};

export default function ContactPage() {
  return (
    <Container>
      <Section
        eyebrow="Contact"
        title="Let’s talk about secure banking platforms"
        description="If you’re hiring for backend, fintech, or banking consulting, I’m happy to discuss how I approach delivery, security, and reliability."
      >
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Motion>
              <Card className="p-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Email
                      </p>
                      <a
                        className="text-sm text-muted hover:underline"
                        href={`mailto:${site.person.email}`}
                      >
                        {site.person.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Linkedin className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        LinkedIn
                      </p>
                      <a
                        className="text-sm text-muted hover:underline"
                        href={site.person.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {site.person.linkedIn.replace("https://", "")}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Location
                      </p>
                      <p className="text-sm text-muted">{site.person.location}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <PrimaryButton href={`mailto:${site.person.email}`}>
                      Email {site.person.name}
                    </PrimaryButton>
                  </div>
                </div>
              </Card>
            </Motion>
          </div>

          <div className="lg:col-span-5">
            <Motion delay={0.05}>
              <Card className="p-6">
                <p className="text-sm font-semibold text-foreground">
                  What I can help with
                </p>
                <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
                  {[
                    "Backend architecture for digital banking and fintech products",
                    "OAuth2/OIDC and Keycloak integrations (design, hardening, rollout)",
                    "Transaction safety patterns: idempotency, reconciliation, auditability",
                    "Production readiness: monitoring, alerts, incident response improvements",
                  ].map((x) => (
                    <li key={x} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Motion>
          </div>
        </div>
      </Section>
    </Container>
  );
}

