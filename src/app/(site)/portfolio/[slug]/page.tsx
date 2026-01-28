import { ArrowRight, ShieldCheck, Landmark, Activity, Mail, Linkedin, MapPin, Phone, MessageCircle } from "lucide-react";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Avatar } from "@/components/avatar";
import { Card, Pill, PrimaryButton, SecondaryButton } from "@/components/ui";
import { Section } from "@/components/section";
import { MenuBlockRenderer } from "@/components/portfolio/menu-block-renderer";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { ScrollToTopButton } from "@/components/portfolio/scroll-to-top";
import {
  getPortfolioBySlug,
  getFirstPersonInfoForPortfolio,
  getHeroContent,
  getSkillsByPortfolio,
  getProjectsByPortfolio,
  getExperienceByPortfolio,
  getAboutContentByPortfolio,
  getArchitectureContentByPortfolio,
  getPersonInfoByPortfolio,
  getMenuBlocksByPortfolioMenuIds,
} from "@/lib/data";
import { NotPublishedPage } from "@/components/portfolio/not-published-page";
import { notFound } from "next/navigation";
import { getSectionIntro } from "@/lib/section-intros";
import { isSectionVisible } from "@/lib/section-visibility";
import { getEnabledPortfolioMenus } from "@/app/actions/portfolio-menu";

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
  
  const person = await getFirstPersonInfoForPortfolio(portfolio.id);

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

  // LEVEL 1: Portfolio-level visibility check (master control)
  if (!portfolio.isPublic) {
    notFound(); // Portfolio is hidden, show 404
  }

  // If portfolio is not PUBLISHED, show friendly not-published page
  if (portfolio.status !== "PUBLISHED") {
    return <NotPublishedPage portfolio={portfolio} />;
  }

  const menus = await getEnabledPortfolioMenus(portfolio.id);
  const componentMenuIds = menus.filter(
    (m) => Array.isArray(m.componentKeys) && m.componentKeys.length > 0
  ).map((m) => m.id);

  const [hero, skillsByMenu, experienceByMenu, projectsByMenu, aboutByMenu, architectureByMenu, personByMenu, blocksByPm] =
    await Promise.all([
      getHeroContent(portfolio.id),
      getSkillsByPortfolio(portfolio.id),
      getExperienceByPortfolio(portfolio.id),
      getProjectsByPortfolio(portfolio.id),
      getAboutContentByPortfolio(portfolio.id),
      getArchitectureContentByPortfolio(portfolio.id),
      getPersonInfoByPortfolio(portfolio.id),
      getMenuBlocksByPortfolioMenuIds(componentMenuIds),
    ]);

  // First person for hero card (avatar, name, cv link)
  const person = await getFirstPersonInfoForPortfolio(portfolio.id);

  // Create a map of menu keys for quick lookup
  const menuKeys = new Set(menus.map((m) => m.key));

  // Helper function to check if a section is in menu configuration
  const isInMenu = (key: string) => menuKeys.has(key);

  // LEVEL 2: Check section visibility (enabled AND has visible data AND in menu configuration)
  const visibilityChecks = await Promise.all([
    isSectionVisible(portfolio.id, "about", {
      showAbout: portfolio.showAbout,
      showSkills: portfolio.showSkills,
      showProjects: portfolio.showProjects,
      showExperience: portfolio.showExperience,
      showArchitecture: portfolio.showArchitecture,
      showContact: portfolio.showContact,
    }),
    isSectionVisible(portfolio.id, "skills", {
      showAbout: portfolio.showAbout,
      showSkills: portfolio.showSkills,
      showProjects: portfolio.showProjects,
      showExperience: portfolio.showExperience,
      showArchitecture: portfolio.showArchitecture,
      showContact: portfolio.showContact,
    }),
    isSectionVisible(portfolio.id, "projects", {
      showAbout: portfolio.showAbout,
      showSkills: portfolio.showSkills,
      showProjects: portfolio.showProjects,
      showExperience: portfolio.showExperience,
      showArchitecture: portfolio.showArchitecture,
      showContact: portfolio.showContact,
    }),
    isSectionVisible(portfolio.id, "experience", {
      showAbout: portfolio.showAbout,
      showSkills: portfolio.showSkills,
      showProjects: portfolio.showProjects,
      showExperience: portfolio.showExperience,
      showArchitecture: portfolio.showArchitecture,
      showContact: portfolio.showContact,
    }),
    isSectionVisible(portfolio.id, "architecture", {
      showAbout: portfolio.showAbout,
      showSkills: portfolio.showSkills,
      showProjects: portfolio.showProjects,
      showExperience: portfolio.showExperience,
      showArchitecture: portfolio.showArchitecture,
      showContact: portfolio.showContact,
    }),
    isSectionVisible(portfolio.id, "contact", {
      showAbout: portfolio.showAbout,
      showSkills: portfolio.showSkills,
      showProjects: portfolio.showProjects,
      showExperience: portfolio.showExperience,
      showArchitecture: portfolio.showArchitecture,
      showContact: portfolio.showContact,
    }),
  ]);

  // Combine visibility checks with menu configuration
  const sectionVisibility: Record<string, boolean> = {
    about: isInMenu("about") && visibilityChecks[0],
    skills: isInMenu("skills") && visibilityChecks[1],
    projects: isInMenu("projects") && visibilityChecks[2],
    experience: isInMenu("experience") && visibilityChecks[3],
    architecture: isInMenu("architecture") && visibilityChecks[4],
    contact: isInMenu("contact") && visibilityChecks[5],
  };

  const heroHeadline = hero?.headline ?? "";
  const heroSubheadline = hero?.subheadline ?? "";
  const heroHighlights: string[] = (hero?.highlights as string[]) ?? [];
  const heroBadges = heroHighlights.slice(0, 3);
  const heroBullets = heroHighlights.slice(3);

  // Derive "Current" and "Focus" from first experience/skills section in menu order
  const firstExperienceData = menus
    .map((m) => experienceByMenu[m.platformMenuId])
    .find((e) => e?.roles?.length);
  const firstSkillsData = menus
    .map((m) => skillsByMenu[m.platformMenuId])
    .find((s) => s?.length);
  const currentRole = firstExperienceData?.roles?.[0]
    ? `${firstExperienceData.roles[0].title}${firstExperienceData.roles[0].company ? ` at ${firstExperienceData.roles[0].company}` : ""}`
    : null;
  const focus =
    firstSkillsData && firstSkillsData.length > 0
      ? firstSkillsData
          .slice(0, 2)
          .flatMap((g) => g.items)
          .slice(0, 6)
          .join(" • ")
      : null;

  // Build cache-busted avatar URL (only if user uploaded one)
  const avatarUrl = person.avatarUrl;
  const avatarSrc = avatarUrl && person.updatedAt
    ? `${avatarUrl}?t=${new Date(person.updatedAt).getTime()}`
    : null;

  return (
    <div>
      <PortfolioHeader 
        slug={slug} 
        name={person.name} 
        avatarSrc={avatarSrc}
        menus={menus}
      />
      <ScrollToTopButton />
      {/* Hero Section */}
      <Container className="py-14 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-7 lg:col-span-7">
            <div className="flex flex-wrap gap-2">
              {heroBadges.map((label, idx) => (
                <Pill key={`${label}-${idx}`}>
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
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl text-safe">
                {heroHeadline}
              </h1>
            </Motion>

            <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed text-safe">
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
              {heroBullets.map((h: string, idx: number) => (
                <li key={`hero-bullet-${idx}`} className="flex gap-2">
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
                          <p className="mt-1 text-sm leading-relaxed text-foreground text-safe">{currentRole}</p>
                        </div>
                      ) : null}
                      {focus ? (
                        <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                          <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                            Focus
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground text-safe">{focus}</p>
                        </div>
                      ) : null}
                      <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                          Location
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground text-safe">{person.location}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Motion>
            </div>
          </div>
        </div>
      </Container>

      {/* Render sections dynamically in menu order (data keyed by platformMenuId) */}
      {menus
        .sort((a, b) => a.order - b.order)
        .map((menu) => {
          const isVisible = menu.key in sectionVisibility ? sectionVisibility[menu.key] : true;
          if (!isVisible) return null;
          const isComponentBased = Array.isArray(menu.componentKeys) && menu.componentKeys.length > 0;
          // Only show blocks that are in the menu's componentKeys (hidden/removed blocks stay in DB but are not displayed)
          const menuBlocks = isComponentBased
            ? (() => {
                const raw = blocksByPm[menu.id] ?? [];
                const keys = Array.isArray(menu.componentKeys) ? menu.componentKeys : [];
                return raw
                  .filter((b) => keys.includes(b.componentKey))
                  .sort((a, b) => keys.indexOf(a.componentKey) - keys.indexOf(b.componentKey));
              })()
            : [];
          const skills = skillsByMenu[menu.platformMenuId];
          const experience = experienceByMenu[menu.platformMenuId];
          const projects = projectsByMenu[menu.platformMenuId];
          const about = aboutByMenu[menu.platformMenuId];
          const architecture = architectureByMenu[menu.platformMenuId];
          const sectionPerson = personByMenu[menu.platformMenuId];

          // Prefer template rendering when we have section data (Skills, Experience, etc. from DB),
          // so that data is always visible even if the menu also has componentKeys set.
          const hasSectionData =
            (menu.key === "skills" && skills && skills.length > 0) ||
            (menu.key === "projects" && projects && projects.length > 0) ||
            (menu.key === "experience" && experience?.roles?.length) ||
            (menu.key === "about" && about) ||
            (menu.key === "architecture" && architecture?.pillars?.length) ||
            (menu.key === "contact" && sectionPerson);

          if (hasSectionData) {
            // Fall through to template switch below (use templateKey so sectionType can be key or key_template)
          } else if (isComponentBased) {
            return (
              <MenuBlockRenderer
                key={menu.key}
                menuKey={menu.key}
                menuLabel={menu.label}
                blocks={menuBlocks}
              />
            );
          }

          const rawTemplate = menu.sectionType ?? (menu.key ? `${menu.key}_template` : null);
          const canonicalSectionKeys = ["skills", "projects", "experience", "about", "architecture", "contact"] as const;
          const templateKey =
            rawTemplate && !rawTemplate.endsWith("_template") && canonicalSectionKeys.includes(rawTemplate as typeof canonicalSectionKeys[number])
              ? `${rawTemplate}_template`
              : rawTemplate;
          switch (templateKey) {
            case "skills_template":
              if (!skills || skills.length === 0) return null;
              return (
                <Container key={menu.key} id={menu.key}>
                  <Section
                    eyebrow={menu.label}
                    title="Skills and expertise"
                    description={getSectionIntro(portfolio.skillsIntro, "skills")}
                  >
                    <div className="grid gap-5 lg:grid-cols-2">
                      {skills.map((group, idx) => (
                        <Motion key={group.group} delay={idx * 0.05}>
                          <Card className="p-6">
                            <p className="text-sm font-semibold text-foreground text-safe">
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

            case "projects_template":
              if (!projects || projects.length === 0) return null;
              return (
                <Container key={menu.key} id={menu.key}>
                  <Section
                    eyebrow={menu.label}
                    title="Projects and work samples"
                    description={getSectionIntro(portfolio.projectsIntro, "projects")}
                  >
                    <div className="grid gap-6 lg:grid-cols-3">
                      {projects.map((p, idx) => (
                        <Motion key={p.title} delay={idx * 0.05}>
                          <Card className="flex h-full flex-col p-6">
                            <div className="space-y-2">
                              <p className="text-base font-semibold text-foreground text-safe">
                                {p.title}
                              </p>
                              <p className="text-sm leading-relaxed text-muted text-safe">{p.summary}</p>
                            </div>

                            <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
                              {p.bullets.map((b) => (
                                <li key={b} className="flex gap-2">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                                  <span className="text-safe">{b}</span>
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

            case "experience_template":
              if (!experience?.roles?.length) return null;
              return (
                <Container key={menu.key} id={menu.key}>
                  <Section
                    eyebrow={menu.label}
                    title="Professional experience and career journey"
                    description={getSectionIntro(portfolio.experienceIntro, "experience")}
                  >
                    <div className="space-y-6">
                      {experience.roles.map((role, idx) => (
                <Motion key={`${role.title}-${role.company}`} delay={idx * 0.05}>
                  <Card className="p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-foreground text-safe">
                          {role.title}
                        </p>
                        <p className="text-sm text-muted text-safe">{role.company}</p>
                        <p className="mt-1 text-xs text-muted-disabled text-safe">
                          {role.location} • {role.period}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {role.tech.map((t) => (
                          <Pill key={t}>{t}</Pill>
                        ))}
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
                      {role.bullets.map((b) => (
                        <li key={b} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                          <span className="text-safe">{b}</span>
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

            case "about_template":
              if (!about) return null;
              return (
                <Container key={menu.key} id={menu.key}>
                  <Section eyebrow={menu.label} title={about.title} description={about.paragraphs[0]}>
            {(() => {
              const additionalParagraphs = about.paragraphs.slice(1);
              const hasAdditionalParagraphs = additionalParagraphs.length > 0;
              const hasPrinciples = about.principles && about.principles.length > 0;
              
              // If no additional paragraphs, render single column layout
              if (!hasAdditionalParagraphs) {
                return (
                  <div className="grid gap-4">
                    {hasPrinciples && about.principles.map((x, idx) => (
                      <Motion key={x.id} delay={idx * 0.05}>
                        <Card className="p-5">
                          <p className="text-sm font-semibold text-foreground text-safe">
                            {x.title}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted text-safe">
                            {x.description}
                          </p>
                        </Card>
                      </Motion>
                    ))}
                  </div>
                );
              }
              
              // If we have additional paragraphs, render two-column layout
              return (
                <div className="grid gap-6 lg:grid-cols-12">
                  <div className="space-y-4 lg:col-span-7">
                    {additionalParagraphs.map((p: string, idx: number) => (
                      <Motion key={idx}>
                        <p className="text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed text-safe">{p}</p>
                      </Motion>
                    ))}
                  </div>
                  {hasPrinciples && (
                    <div className="lg:col-span-5">
                      <div className="grid gap-4">
                        {about.principles.map((x, idx) => (
                          <Motion key={x.id} delay={idx * 0.05}>
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
                  )}
                </div>
              );
            })()}
                  </Section>
                </Container>
              );

            case "architecture_template":
              if (!architecture?.pillars?.length) return null;
              return (
                <Container key={menu.key} id={menu.key}>
                  <Section
                    eyebrow={menu.label}
                    title="Technical architecture and design principles"
                    description={getSectionIntro(portfolio.architectureIntro, "architecture")}
                  >
            <div className="grid gap-6 lg:grid-cols-3">
              {architecture.pillars.map((p, idx) => (
                <Motion key={p.title} delay={idx * 0.05}>
                  <Card className="h-full p-6">
                    <p className="text-base font-semibold text-foreground text-safe">
                      {p.title}
                    </p>
                    <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
                      {p.points.map((x) => (
                        <li key={x} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                          <span className="text-safe">{x}</span>
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

            case "contact_template":
              if (!sectionPerson) return null;
              return (
                <Container key={menu.key} id={menu.key}>
                  <Section
                    eyebrow={menu.label}
                    title="Get in touch"
                    description={getSectionIntro(sectionPerson.contactMessage ?? undefined, "contact")}
                  >
                    <div className="grid gap-6 lg:grid-cols-12">
                      <div className="lg:col-span-7">
                        <Motion>
                          <Card className="p-6">
                            <div className="space-y-5">
                              {sectionPerson.showEmail1 && (sectionPerson.email1 || sectionPerson.email) && (
                                <div className="flex items-start gap-3">
                                  <Mail className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">Email</p>
                                    <a
                                      className="text-sm text-muted hover:underline"
                                      href={`mailto:${sectionPerson.email1 || sectionPerson.email}`}
                                    >
                                      {sectionPerson.email1 || sectionPerson.email}
                                    </a>
                                  </div>
                                </div>
                              )}
                                {sectionPerson.showEmail2 && sectionPerson.email2 && (
                                <div className="flex items-start gap-3">
                                  <Mail className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">Email (Secondary)</p>
                                    <a className="text-sm text-muted hover:underline" href={`mailto:${sectionPerson.email2}`}>
                                      {sectionPerson.email2}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {sectionPerson.showPhone1 && (sectionPerson.phone1 || sectionPerson.phone) && (
                                <div className="flex items-start gap-3">
                                  <Phone className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">Phone</p>
                                    <a className="text-sm text-muted hover:underline" href={`tel:${sectionPerson.phone1 || sectionPerson.phone}`}>
                                      {sectionPerson.phone1 || sectionPerson.phone}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {sectionPerson.showPhone2 && sectionPerson.phone2 && (
                                <div className="flex items-start gap-3">
                                  <Phone className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">Phone (Secondary)</p>
                                    <a className="text-sm text-muted hover:underline" href={`tel:${sectionPerson.phone2}`}>
                                      {sectionPerson.phone2}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {sectionPerson.showWhatsApp && sectionPerson.whatsapp && (
                                <div className="flex items-start gap-3">
                                  <MessageCircle className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                                    <a
                                      className="text-sm text-muted hover:underline"
                                      href={`https://wa.me/${sectionPerson.whatsapp.replace(/[^\d]/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {sectionPerson.whatsapp}
                                    </a>
                                  </div>
                                </div>
                              )}
                              {sectionPerson.linkedIn && (
                                <div className="flex items-start gap-3">
                                  <Linkedin className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">LinkedIn</p>
                                    <a
                                      className="text-sm text-muted hover:underline"
                                      href={sectionPerson.linkedIn}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {sectionPerson.linkedIn.replace("https://", "")}
                                    </a>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">Location</p>
                                  <p className="text-sm text-muted">{sectionPerson.location}</p>
                                </div>
                              </div>
                              <div className="pt-2">
                                {sectionPerson.showEmail1 && (sectionPerson.email1 || sectionPerson.email) && (
                                  <PrimaryButton href={`mailto:${sectionPerson.email1 || sectionPerson.email}`}>
                                    Email {sectionPerson.name}
                                  </PrimaryButton>
                                )}
                              </div>
                            </div>
                          </Card>
                      </Motion>
                    </div>
                  </div>
                </Section>
              </Container>
              );

            default:
              return null;
          }
        })}
    </div>
  );
}