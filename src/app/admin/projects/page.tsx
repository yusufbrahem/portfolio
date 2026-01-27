import { Container } from "@/components/container";
import { getProjectsForAdmin } from "@/app/actions/projects";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ProjectsManager } from "@/components/admin/projects-manager";
import { SectionIntroEditor } from "@/components/admin/section-intro-editor";
import { SectionVisibilityToggle } from "@/components/admin/section-visibility-toggle";
import { getPortfolioIntros } from "@/app/actions/portfolio-intros";
import { getSectionVisibility } from "@/app/actions/section-visibility";
import { isMenuEnabled } from "@/app/actions/menu-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminProjectsPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  const menuEnabled = await isMenuEnabled("projects");
  if (!menuEnabled) {
    redirect("/admin?message=This section is disabled by the platform.");
  }

  const menu = await prisma.platformMenu.findUnique({
    where: { key: "projects" },
    select: { id: true, label: true },
  });
  if (!menu) {
    redirect("/admin?message=Section not found.");
  }

  const [projects, portfolioIntros, visibility] = await Promise.all([
    getProjectsForAdmin(menu.id),
    getPortfolioIntros(),
    getSectionVisibility(),
  ]);

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Manage {menu.label}</h1>
          <p className="text-muted">Add, edit, or delete portfolio projects</p>
        </div>
        <SectionVisibilityToggle
          section="projects"
          initialValue={visibility?.showProjects ?? true}
          isReadOnly={scope.isImpersonating}
        />
        <SectionIntroEditor
          section="projects"
          initialValue={portfolioIntros?.projectsIntro}
          isReadOnly={scope.isImpersonating}
        />
        <ProjectsManager
          initialData={projects}
          isReadOnly={scope.isImpersonating}
          platformMenuId={menu.id}
        />
      </div>
    </Container>
  );
}
