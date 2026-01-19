import { prisma } from "./prisma";

// Public data access functions - used by public pages

export async function getPersonInfo() {
  const info = await prisma.personInfo.findFirst();
  if (!info) {
    // Fallback to default if not in DB
    return {
      name: "Youssef Brahem",
      role: "Senior Backend & Fintech Engineer",
      location: "Doha, Qatar",
      email: "yusufbrahem1@gmail.com",
      linkedIn: "https://www.linkedin.com/in/youssef-brahem-8ab717159/",
    };
  }
  return info;
}

export async function getHeroContent() {
  const hero = await prisma.heroContent.findFirst();
  if (!hero) {
    return {
      headline: "Senior Backend & Fintech Engineer building secure banking platforms.",
      subheadline:
        "5+ years delivering transaction systems, payment integrations, and identity-driven APIs in banking and fintech.",
      highlights: [
        "Secure REST APIs and service-to-service authorization",
        "Transaction processing, payments, reconciliation, and auditability",
        "Bank-grade observability, resilience, and operational readiness",
      ],
    };
  }
  return {
    ...hero,
    highlights: JSON.parse(hero.highlights || "[]"),
  };
}

export async function getSkills() {
  const groups = await prisma.skillGroup.findMany({
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

export async function getExperience() {
  const roles = await prisma.experience.findMany({
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

export async function getProjects() {
  const projects = await prisma.project.findMany({
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

export async function getAboutContent() {
  const about = await prisma.aboutContent.findFirst({
    include: {
      principles: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!about) {
    return {
      title: "Backend engineering for banking-grade security and reliability",
      paragraphs: [
        "I'm a Senior Backend Engineer based in Doha, Qatar.",
      ],
      principles: [],
    };
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
