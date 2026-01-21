import { Container } from "@/components/container";
import { getProjectsForAdmin } from "@/app/actions/projects";
import { getAdminReadScope } from "@/lib/auth";
import { ProjectsManager } from "@/components/admin/projects-manager";

export default async function AdminProjectsPage() {
  const projects = await getProjectsForAdmin();
  const scope = await getAdminReadScope();

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
