import { prisma } from "./prisma";
import { notFound } from "next/navigation";

// Public data access functions - used by public pages

/**
 * Get portfolio by slug - public access
 * Returns portfolio with status, never throws 404 (returns null if not found)
 * Caller should handle status to show appropriate content
 */
export async function getPortfolioBySlug(slug: string) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      isPublished: true,
      status: true,
      rejectionReason: true,
      userId: true,
      skillsIntro: true,
      projectsIntro: true,
      experienceIntro: true,
      architectureIntro: true,
      isPublic: true,
      showAbout: true,
      showSkills: true,
      showProjects: true,
      showExperience: true,
      showArchitecture: true,
      showContact: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return portfolio;
}

// Public read - portfolio + section instance (platform menu)
export async function getPersonInfo(portfolioId: string, platformMenuId: string) {
  const info = await prisma.personInfo.findUnique({
    where: { portfolioId_platformMenuId: { portfolioId, platformMenuId } },
    select: {
      id: true,
      portfolioId: true,
      name: true,
      role: true,
      location: true,
      email: true,
      linkedIn: true,
      phone: true,
      contactMessage: true,
      cvUrl: true,
      avatarUrl: true,
      updatedAt: true,
      createdAt: true,
      phone1: true,
      phone2: true,
      whatsapp: true,
      email1: true,
      email2: true,
      showPhone1: true,
      showPhone2: true,
      showWhatsApp: true,
      showEmail1: true,
      showEmail2: true,
    },
  });
  if (!info) notFound();
  return info;
}

// Public read - no auth required
// Accepts optional portfolioId for future public portfolio pages
// If no portfolioId provided, returns first available (backward compatible, will need update in Phase 5)
export async function getHeroContent(portfolioId: string) {
  const hero = await prisma.heroContent.findUnique({
    where: { portfolioId },
  });
  if (!hero) return null;
  return { ...hero, highlights: JSON.parse(hero.highlights || "[]") };
}

// Public read - one section instance (portfolio + platform menu)
export async function getSkills(portfolioId: string, platformMenuId: string) {
  const groups = await prisma.skillGroup.findMany({
    where: { portfolioId, platformMenuId, isVisible: true },
    include: {
      skills: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  });
  return groups.map((group) => ({
    group: group.name,
    items: group.skills.map((s) => s.name),
  }));
}

// Batch: all skills for a portfolio, keyed by platformMenuId (for public page)
export async function getSkillsByPortfolio(portfolioId: string): Promise<Record<string, Array<{ group: string; items: string[] }>>> {
  const groups = await prisma.skillGroup.findMany({
    where: { portfolioId, isVisible: true },
    include: { skills: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  const byMenu: Record<string, Array<{ group: string; items: string[] }>> = {};
  for (const g of groups) {
    if (!byMenu[g.platformMenuId]) byMenu[g.platformMenuId] = [];
    byMenu[g.platformMenuId].push({
      group: g.name,
      items: g.skills.map((s) => s.name),
    });
  }
  return byMenu;
}

// Public read - one section instance
export async function getExperience(portfolioId: string, platformMenuId: string) {
  const roles = await prisma.experience.findMany({
    where: { portfolioId, platformMenuId, isVisible: true },
    include: {
      bullets: { orderBy: { order: "asc" } },
      tech: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  });
  return {
    intro: null,
    roles: roles.map((role) => ({
      title: role.title,
      company: role.company,
      location: role.location,
      period: role.period,
      bullets: role.bullets.map((b) => b.text),
      tech: role.tech.map((t) => t.name),
    })),
  };
}

// Batch: experiences by platformMenuId
export async function getExperienceByPortfolio(portfolioId: string): Promise<
  Record<string, { intro: null; roles: Array<{ title: string; company: string; location: string; period: string; bullets: string[]; tech: string[] }> }>
> {
  const roles = await prisma.experience.findMany({
    where: { portfolioId, isVisible: true },
    include: { bullets: { orderBy: { order: "asc" } }, tech: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  const byMenu: Record<string, { intro: null; roles: typeof roles }> = {};
  for (const r of roles) {
    if (!byMenu[r.platformMenuId]) byMenu[r.platformMenuId] = { intro: null, roles: [] };
    byMenu[r.platformMenuId].roles.push(r);
  }
  const result: Record<string, { intro: null; roles: Array<{ title: string; company: string; location: string; period: string; bullets: string[]; tech: string[] }> }> = {};
  for (const [menuId, v] of Object.entries(byMenu)) {
    result[menuId] = {
      intro: null,
      roles: v.roles.map((role) => ({
        title: role.title,
        company: role.company,
        location: role.location,
        period: role.period,
        bullets: role.bullets.map((b) => b.text),
        tech: role.tech.map((t) => t.name),
      })),
    };
  }
  return result;
}

// Public read - one section instance
export async function getProjects(portfolioId: string, platformMenuId: string) {
  const projects = await prisma.project.findMany({
    where: { portfolioId, platformMenuId, isVisible: true },
    include: {
      bullets: { orderBy: { order: "asc" } },
      tags: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  });
  return projects.map((p) => ({
    title: p.title,
    summary: p.summary,
    bullets: p.bullets.map((b) => b.text),
    tags: p.tags.map((t) => t.name),
  }));
}

// Batch: projects by platformMenuId
export async function getProjectsByPortfolio(portfolioId: string): Promise<
  Record<string, Array<{ title: string; summary: string; bullets: string[]; tags: string[] }>>
> {
  const projects = await prisma.project.findMany({
    where: { portfolioId, isVisible: true },
    include: { bullets: { orderBy: { order: "asc" } }, tags: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });
  const byMenu: Record<string, typeof projects> = {};
  for (const p of projects) {
    if (!byMenu[p.platformMenuId]) byMenu[p.platformMenuId] = [];
    byMenu[p.platformMenuId].push(p);
  }
  const result: Record<string, Array<{ title: string; summary: string; bullets: string[]; tags: string[] }>> = {};
  for (const [menuId, list] of Object.entries(byMenu)) {
    result[menuId] = list.map((p) => ({
      title: p.title,
      summary: p.summary,
      bullets: p.bullets.map((b) => b.text),
      tags: p.tags.map((t) => t.name),
    }));
  }
  return result;
}

// Public read - no auth required
// Accepts optional portfolioId for future public portfolio pages
// If no portfolioId provided, returns first available (backward compatible, will need update in Phase 5)
export async function getAboutContent(portfolioId: string) {
  const about = await prisma.aboutContent.findUnique({
    where: { portfolioId },
    include: {
      principles: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!about) {
    return null;
  }

  return {
    title: about.title,
    paragraphs: JSON.parse(about.paragraphs || "[]"),
    principles: about.principles.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
    })),
  };
}

// Public read - no auth required
// Accepts optional portfolioId for future public portfolio pages
// If no portfolioId provided, returns first available (backward compatible, will need update in Phase 5)
export async function getArchitectureContent(portfolioId: string) {
  const architecture = await prisma.architectureContent.findUnique({
    where: { portfolioId },
    include: {
      pillars: {
        where: {
          isVisible: true, // Only return visible pillars
        },
        include: {
          points: {
            orderBy: { order: "asc" },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!architecture) {
    return null;
  }

  return {
    pillars: architecture.pillars.map((pillar) => ({
      title: pillar.title,
      points: pillar.points.map((point) => point.text),
    })),
  };
}
