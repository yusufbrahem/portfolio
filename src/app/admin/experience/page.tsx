import { Container } from "@/components/container";
import { getExperiencesForAdmin } from "@/app/actions/experience";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ExperienceManager } from "@/components/admin/experience-manager";
import { redirect } from "next/navigation";

export default async function AdminExperiencePage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }
  
  const experiences = await getExperiencesForAdmin();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Manage Experience</h1>
          <p className="text-muted">Add, edit, or delete work experience entries</p>
        </div>
        <ExperienceManager initialData={experiences} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
