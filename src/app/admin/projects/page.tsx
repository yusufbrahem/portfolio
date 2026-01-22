import { Container } from "@/components/container";
import { getProjectsForAdmin } from "@/app/actions/projects";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ProjectsManager } from "@/components/admin/projects-manager";
import { redirect } from "next/navigation";

export default async function AdminProjectsPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }
  
  const projects = await getProjectsForAdmin();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Manage Projects</h1>
          <p className="text-muted">Add, edit, or delete portfolio projects</p>
        </div>
        <ProjectsManager initialData={projects} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
