import { Container } from "@/components/container";
import { getExperiencesForAdmin } from "@/app/actions/experience";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ExperienceManager } from "@/components/admin/experience-manager";
import { SectionIntroEditor } from "@/components/admin/section-intro-editor";
import { SectionVisibilityToggle } from "@/components/admin/section-visibility-toggle";
import { getPortfolioIntros } from "@/app/actions/portfolio-intros";
import { getSectionVisibility } from "@/app/actions/section-visibility";
import { isMenuEnabled } from "@/app/actions/menu-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminExperiencePage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  const menuEnabled = await isMenuEnabled("experience");
  if (!menuEnabled) {
    redirect("/admin?message=This section is disabled by the platform.");
  }

  const menu = await prisma.platformMenu.findUnique({
    where: { key: "experience" },
    select: { id: true, label: true },
  });
  if (!menu) {
    redirect("/admin?message=Section not found.");
  }

  const [experiences, portfolioIntros, visibility] = await Promise.all([
    getExperiencesForAdmin(menu.id),
    getPortfolioIntros(),
    getSectionVisibility(),
  ]);

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Manage {menu.label}</h1>
          <p className="text-muted">Add, edit, or delete entries</p>
        </div>
        <SectionVisibilityToggle
          section="experience"
          initialValue={visibility?.showExperience ?? true}
          isReadOnly={scope.isImpersonating}
        />
        <SectionIntroEditor
          section="experience"
          initialValue={portfolioIntros?.experienceIntro}
          isReadOnly={scope.isImpersonating}
        />
        <ExperienceManager
          initialData={experiences}
          isReadOnly={scope.isImpersonating}
          platformMenuId={menu.id}
        />
      </div>
    </Container>
  );
}
