import { prisma } from "./prisma";
import { notFound } from "next/navigation";

// Public data access functions - used by public pages

/**
 * Get portfolio by slug - public access
 * Returns portfolio if published, throws 404 if not found or not published
 */
export async function getPortfolioBySlug(slug: string) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      isPublished: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!portfolio || !portfolio.isPublished) {
    notFound();
  }

  return portfolio;
}

// Public read - portfolio scoped (no auth required)
export async function getPersonInfo(portfolioId: string) {
  const info = await prisma.personInfo.findUnique({
    where: { portfolioId },
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

// Public read - no auth required
// Accepts optional portfolioId for future public portfolio pages
// If no portfolioId provided, returns all (backward compatible, will need update in Phase 5)
export async function getSkills(portfolioId: string) {
  const where = { portfolioId };
  
  const groups = await prisma.skillGroup.findMany({
    where,
    include: {
      skills: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return groups.map((group) => ({
    group: group.name,
    items: group.skills.map((s) => s.name),
  }));
}

// Public read - no auth required
// Accepts optional portfolioId for future public portfolio pages
// If no portfolioId provided, returns all (backward compatible, will need update in Phase 5)
export async function getExperience(portfolioId: string) {
  const where = { portfolioId };
  
  const roles = await prisma.experience.findMany({
    where,
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tech: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return {
    intro:
      "Experience across banking and fintech, with emphasis on secure APIs, transaction platforms, and identity governance.",
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

// Public read - no auth required
// Accepts optional portfolioId for future public portfolio pages
// If no portfolioId provided, returns all (backward compatible, will need update in Phase 5)
export async function getProjects(portfolioId: string) {
  const where = { portfolioId };
  
  const projects = await prisma.project.findMany({
    where,
    include: {
      bullets: {
        orderBy: { order: "asc" },
      },
      tags: {
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  return projects.map((project) => ({
    title: project.title,
    summary: project.summary,
    bullets: project.bullets.map((b) => b.text),
    tags: project.tags.map((t) => t.name),
  }));
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
