import { Container } from "@/components/container";
import { getProjectsForAdmin } from "@/app/actions/projects";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ProjectsManager } from "@/components/admin/projects-manager";
import { SectionIntroEditor } from "@/components/admin/section-intro-editor";
import { SectionVisibilityToggle } from "@/components/admin/section-visibility-toggle";
import { getPortfolioIntros } from "@/app/actions/portfolio-intros";
import { getSectionVisibility } from "@/app/actions/section-visibility";
import { redirect } from "next/navigation";

export default async function AdminProjectsPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }
  
  const [projects, portfolioIntros, visibility] = await Promise.all([
    getProjectsForAdmin(),
    getPortfolioIntros(),
    getSectionVisibility(),
  ]);

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Manage Projects</h1>
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
        
        <ProjectsManager initialData={projects} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
