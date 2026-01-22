import { ArrowRight, ShieldCheck, Landmark, Activity, Mail, Linkedin, MapPin } from "lucide-react";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Avatar } from "@/components/avatar";
import { Card, Pill, PrimaryButton, SecondaryButton } from "@/components/ui";
import { Section } from "@/components/section";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { ScrollToTopButton } from "@/components/portfolio/scroll-to-top";
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
import { NotPublishedPage } from "@/components/portfolio/not-published-page";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const portfolio = await getPortfolioBySlug(slug);
  
  // Only generate metadata for published portfolios
  if (!portfolio || portfolio.status !== "PUBLISHED") {
    return {
      title: "Portfolio Not Available",
      description: "This portfolio is not available.",
    };
  }
  
  const person = await getPersonInfo(portfolio.id);

  return {
    title: `${person.name} — ${person.role}`,
    description: person.role,
  };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Get portfolio - returns null if not found, includes status
  const portfolio = await getPortfolioBySlug(slug);

  // If portfolio not found, show 404
  if (!portfolio) {
    notFound();
  }

  // If portfolio is not PUBLISHED, show friendly not-published page
  if (portfolio.status !== "PUBLISHED") {
    return <NotPublishedPage portfolio={portfolio} />;
  }

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

  const heroHeadline = hero?.headline ?? "";
  const heroSubheadline = hero?.subheadline ?? "";
  const heroHighlights: string[] = (hero?.highlights as string[]) ?? [];
  const heroBadges = heroHighlights.slice(0, 3);
  const heroBullets = heroHighlights.slice(3);

  // Derive "Current" and "Focus" from user-owned data (no hardcoded strings)
  const currentRole = experience?.roles?.[0]
    ? `${experience.roles[0].title}${experience.roles[0].company ? ` at ${experience.roles[0].company}` : ""}`
    : null;
  const focus =
    skills && skills.length > 0
      ? skills
          .slice(0, 2)
          .flatMap((g) => g.items)
          .slice(0, 6)
          .join(" • ")
      : null;

  // Build cache-busted avatar URL (only if user uploaded one)
  const avatarUrl = (person as any).avatarUrl;
  const avatarSrc = avatarUrl
    ? `${avatarUrl}?t=${new Date((person as any).updatedAt).getTime()}`
    : null;

  return (
    <div>
      <PortfolioHeader slug={slug} name={person.name} avatarSrc={avatarSrc} />
      <ScrollToTopButton />
      {/* Hero Section */}
      <Container className="py-14 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-7 lg:col-span-7">
            <div className="flex flex-wrap gap-2">
              {heroBadges.map((label, idx) => (
                <Pill key={label}>
                  {idx === 0 ? (
                    <ShieldCheck className="h-4 w-4 text-accent" aria-hidden="true" />
                  ) : idx === 1 ? (
                    <Landmark className="h-4 w-4 text-accent" aria-hidden="true" />
                  ) : (
                    <Activity className="h-4 w-4 text-accent" aria-hidden="true" />
                  )}
                  <span className="ml-2">{label}</span>
                </Pill>
              ))}
            </div>

            <Motion delay={0.05}>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {heroHeadline}
              </h1>
            </Motion>

            <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              {heroSubheadline}
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
              {heroBullets.map((h: string) => (
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
                {avatarSrc ? (
                  <Avatar
                    src={avatarSrc}
                    alt={`${person.name} headshot`}
                    priority
                    className="mx-auto aspect-square w-[260px] sm:w-[300px] lg:w-full"
                  />
                ) : (
                  <div className="mx-auto aspect-square w-[260px] sm:w-[300px] lg:w-full rounded-2xl border border-border bg-panel flex items-center justify-center">
                    <div className="text-6xl font-bold text-muted">
                      {person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                )}
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
                      {currentRole ? (
                        <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                          <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                            Current
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground">{currentRole}</p>
                        </div>
                      ) : null}
                      {focus ? (
                        <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                          <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                            Focus
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground">{focus}</p>
                        </div>
                      ) : null}
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
        <Container id="skills">
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
        <Container id="projects">
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
        <Container id="experience">
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
        <Container id="about">
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
        <Container id="architecture">
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