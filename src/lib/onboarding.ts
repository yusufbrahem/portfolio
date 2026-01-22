import "server-only";
import { prisma } from "./prisma";
import { getSession } from "./auth";

/**
 * Check if user needs onboarding.
 * Returns true if:
 * - User has not completed onboarding
 * - Portfolio has no meaningful content (no personInfo, no hero, no content sections)
 */
export async function needsOnboarding(): Promise<boolean> {
  const session = await getSession();
  if (!session?.user || session.user.role === "super_admin") {
    return false;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { 
      onboardingCompleted: true,
      onboardingStep: true,
      portfolio: { 
        select: { id: true } 
      } 
    },
  });

  if (!user) {
    return false;
  }

  // If onboarding already completed (step 6), no need
  if (user.onboardingCompleted || user.onboardingStep === 6) {
    return false;
  }

  // If no portfolio, needs onboarding
  if (!user.portfolio) {
    return true;
  }

  // Check if portfolio has meaningful content
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: user.portfolio.id },
    select: {
      personInfo: { select: { id: true } },
      heroContent: { select: { id: true } },
      skillGroups: { select: { id: true }, take: 1 },
      projects: { select: { id: true }, take: 1 },
      experiences: { select: { id: true }, take: 1 },
      aboutContent: { select: { id: true } },
      architectureContent: { select: { id: true } },
    },
  });

  if (!portfolio) {
    return true;
  }

  // Check if has meaningful content
  const hasPersonInfo = !!portfolio.personInfo;
  const hasHero = !!portfolio.heroContent;
  const hasSkills = portfolio.skillGroups.length > 0;
  const hasProjects = portfolio.projects.length > 0;
  const hasExperience = portfolio.experiences.length > 0;
  const hasAbout = !!portfolio.aboutContent;
  const hasArchitecture = !!portfolio.architectureContent;

  // Needs onboarding if missing personInfo, hero, or all content sections
  const hasAnyContent = hasSkills || hasProjects || hasExperience || hasAbout || hasArchitecture;
  
  return !hasPersonInfo || !hasHero || !hasAnyContent;
}

