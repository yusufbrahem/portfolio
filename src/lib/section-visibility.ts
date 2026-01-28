import {
  getSkills,
  getProjects,
  getExperience,
  getArchitectureContent,
  getPersonInfo,
  getAboutContent,
  getPlatformMenuIdForSection,
} from "./data";

/**
 * Check if a section has meaningful visible data to display (per section instance).
 * Resolves platformMenuId from portfolio + menu key, then checks data.
 */
export async function hasSectionData(
  portfolioId: string,
  section: "about" | "skills" | "projects" | "experience" | "architecture" | "contact"
): Promise<boolean> {
  const menuId = await getPlatformMenuIdForSection(portfolioId, section);
  if (!menuId) return false;

  switch (section) {
    case "about": {
      const about = await getAboutContent(portfolioId, menuId);
      return !!about && about.paragraphs && about.paragraphs.length > 0;
    }
    case "skills": {
      const skills = await getSkills(portfolioId, menuId);
      return skills && skills.length > 0 && skills.some((g: { items: unknown[] }) => g.items.length > 0);
    }
    case "projects": {
      const projects = await getProjects(portfolioId, menuId);
      return projects && projects.length > 0;
    }
    case "experience": {
      const experience = await getExperience(portfolioId, menuId);
      return experience?.roles && experience.roles.length > 0;
    }
    case "architecture": {
      const architecture = await getArchitectureContent(portfolioId, menuId);
      return !!(architecture?.pillars && architecture.pillars.length > 0);
    }
    case "contact": {
      try {
        const person = await getPersonInfo(portfolioId, menuId);
        const hasVisibleEmail =
          (person.showEmail1 && (person.email1 || person.email)) ||
          (person.showEmail2 && person.email2);
        const hasVisiblePhone =
          (person.showPhone1 && (person.phone1 || person.phone)) ||
          (person.showPhone2 && person.phone2) ||
          (person.showWhatsApp && person.whatsapp);
        return !!(hasVisibleEmail || hasVisiblePhone || person.cvUrl || person.contactMessage);
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

/**
 * Check if a section should be visible (enabled AND has visible data)
 * Considers both section-level and item-level visibility
 */
export async function isSectionVisible(
  portfolioId: string,
  section: "about" | "skills" | "projects" | "experience" | "architecture" | "contact",
  visibility: {
    showAbout?: boolean;
    showSkills?: boolean;
    showProjects?: boolean;
    showExperience?: boolean;
    showArchitecture?: boolean;
    showContact?: boolean;
  }
): Promise<boolean> {
  // Check if section is enabled
  const isEnabled = (() => {
    switch (section) {
      case "about":
        return visibility.showAbout !== false; // Default to true
      case "skills":
        return visibility.showSkills !== false;
      case "projects":
        return visibility.showProjects !== false;
      case "experience":
        return visibility.showExperience !== false;
      case "architecture":
        return visibility.showArchitecture !== false;
      case "contact":
        return visibility.showContact !== false;
      default:
        return false;
    }
  })();

  if (!isEnabled) {
    return false;
  }

  // Check if section has visible data (items are filtered by visibility in data.ts)
  return hasSectionData(portfolioId, section);
}
