import { ArrowRight, ShieldCheck, Landmark, Activity, Mail, Linkedin, MapPin } from "lucide-react";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Avatar } from "@/components/avatar";
import { Card, Pill, PrimaryButton, SecondaryButton } from "@/components/ui";
import { Section } from "@/components/section";
import {
  getPortfolioBySlug,
  getPersonInfo,
  getHeroContent,
  getSkills,
  getProjects,
  getExperience,
  getAboutContent,
  getArchitectureContent,
} from "@/lib/data";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const portfolio = await getPortfolioBySlug(slug);
  const person = await getPersonInfo(portfolio.id);

  return {
    title: `${person.name} — ${person.role}`,
    description: person.role,
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Get portfolio - will throw 404 if not found or not published
  const portfolio = await getPortfolioBySlug(slug);

  // Fetch all portfolio-specific data
  const [person, hero, skills, projects, experience, about, architecture] = await Promise.all([
    getPersonInfo(portfolio.id),
    getHeroContent(portfolio.id),
    getSkills(portfolio.id),
    getProjects(portfolio.id),
    getExperience(portfolio.id),
    getAboutContent(portfolio.id),
    getArchitectureContent(portfolio.id),
  ]);

  return (
    <div>
      {/* Hero Section */}
      <Container className="py-14 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-7 lg:col-span-7">
            <div className="flex flex-wrap gap-2">
              <Pill>
                <ShieldCheck
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
                <span className="ml-2">Security-first backend</span>
              </Pill>
              <Pill>
                <Landmark
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
                <span className="ml-2">Banking & fintech</span>
              </Pill>
              <Pill>
                <Activity
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
                <span className="ml-2">Production reliability</span>
              </Pill>
            </div>

            <Motion delay={0.05}>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {hero.headline}
              </h1>
            </Motion>

            <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              {hero.subheadline}
            </p>

            <Motion delay={0.15}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryButton href="#contact">
                  Start a conversation <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
                {person.cvUrl && (
                  <SecondaryButton href={person.cvUrl} target="_blank" rel="noopener noreferrer">
                    Resume
                  </SecondaryButton>
                )}
              </div>
            </Motion>

            <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
              {hero.highlights.map((h: string) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="grid gap-5">
              <Motion delay={0.08}>
                <Avatar
                  src="/profile.png"
                  alt={`${person.name} headshot`}
                  priority
                  className="mx-auto aspect-square w-[260px] sm:w-[300px] lg:w-full"
                />
              </Motion>
              <Motion delay={0.12}>
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                        Profile
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {person.name}
                      </p>
                      <p className="text-sm text-muted">{person.role}</p>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                          Current
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">
                          Banking Consultant at Proxym Qatar (Client: QIIB)
                        </p>
                      </div>
                      <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                          Focus
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">
                          Secure APIs • Identity (OAuth2/OIDC, Keycloak) • Transaction systems
                        </p>
                      </div>
                      <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                          Location
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">{person.location}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Motion>
            </div>
          </div>
        </div>
      </Container>

      {/* Skills Section */}
      {skills && skills.length > 0 && (
        <Container>
          <Section eyebrow="Skills" title="Senior backend toolkit for regulated fintech environments" description="A practical, production-focused skill set spanning secure APIs, identity governance, and transaction-grade persistence.">
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
      )}

      {/* Projects Section */}
      {projects && projects.length > 0 && (
        <Container>
          <Section eyebrow="Projects" title="Banking-grade delivery, anonymized with measurable relevance" description="Examples of the systems and patterns I've shipped in regulated environments—identity, transactions, and operational resilience.">
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
      )}

      {/* Experience Section */}
      {experience && experience.roles && experience.roles.length > 0 && (
        <Container>
          <Section eyebrow="Experience" title="Banking and fintech delivery—security, transactions, reliability" description={experience.intro}>
            <div className="space-y-6">
              {experience.roles.map((role, idx) => (
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
      )}

      {/* About Section */}
      {about && (
        <Container>
          <Section eyebrow="About" title={about.title} description={about.paragraphs[0]}>
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
      )}

      {/* Architecture Section */}
      {architecture && architecture.pillars && architecture.pillars.length > 0 && (
        <Container>
          <Section eyebrow="Architecture" title="Security, transactions, and scalability—built for regulated environments" description="A concise view of the patterns I apply to reduce risk and keep systems predictable under load.">
            <div className="grid gap-6 lg:grid-cols-3">
              {architecture.pillars.map((p, idx) => (
                <Motion key={p.title} delay={idx * 0.05}>
                  <Card className="h-full p-6">
                    <p className="text-base font-semibold text-foreground">
                      {p.title}
                    </p>
                    <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
                      {p.points.map((x) => (
                        <li key={x} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
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
      )}

      {/* Contact Section */}
      <Container id="contact">
        <Section eyebrow="Contact" title="Let's talk about secure banking platforms" description="If you're hiring for backend, fintech, or banking consulting, I'm happy to discuss how I approach delivery, security, and reliability.">
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
                          href={`mailto:${person.email}`}
                        >
                          {person.email}
                        </a>
                      </div>
                    </div>

                    {person.linkedIn && (
                      <div className="flex items-start gap-3">
                        <Linkedin className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            LinkedIn
                          </p>
                          <a
                            className="text-sm text-muted hover:underline"
                            href={person.linkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {person.linkedIn.replace("https://", "")}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Location
                        </p>
                        <p className="text-sm text-muted">{person.location}</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <PrimaryButton href={`mailto:${person.email}`}>
                        Email {person.name}
                      </PrimaryButton>
                    </div>
                  </div>
                </Card>
              </Motion>
            </div>
          </div>
        </Section>
      </Container>
    </div>
  );
}