import { getSkills, getProjects, getExperience, getArchitectureContent, getPersonInfo, getAboutContent } from "./data";

/**
 * Check if a section has meaningful visible data to display
 * (considers item-level visibility)
 */
export async function hasSectionData(
  portfolioId: string,
  section: "about" | "skills" | "projects" | "experience" | "architecture" | "contact"
): Promise<boolean> {
  switch (section) {
    case "about": {
      const about = await getAboutContent(portfolioId);
      return !!about && about.paragraphs && about.paragraphs.length > 0;
    }
    case "skills": {
      const skills = await getSkills(portfolioId);
      return skills && skills.length > 0 && skills.some((g) => g.items.length > 0);
    }
    case "projects": {
      const projects = await getProjects(portfolioId);
      return projects && projects.length > 0;
    }
    case "experience": {
      const experience = await getExperience(portfolioId);
      return experience?.roles && experience.roles.length > 0;
    }
    case "architecture": {
      const architecture = await getArchitectureContent(portfolioId);
      return architecture?.pillars && architecture.pillars.length > 0;
    }
    case "contact": {
      const person = await getPersonInfo(portfolioId);
      // Contact section is visible if ANY meaningful contact data exists:
      // - Email (always present, but check anyway)
      // - Phone number
      // - CV URL
      // - Contact message
      if (!person) return false;
      return !!(
        person.email ||
        person.phone ||
        person.cvUrl ||
        person.contactMessage
      );
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
