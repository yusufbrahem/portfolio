import { Container } from "@/components/container";
import { getArchitectureContentForAdmin, ensureArchitectureContent } from "@/app/actions/architecture";
import { getAdminReadScope, assertNotImpersonatingForWrite, requireAuth } from "@/lib/auth";
import { ArchitectureManager } from "@/components/admin/architecture-manager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminArchitecturePage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }
  let architectureContent = await getArchitectureContentForAdmin();
  
  // Ensure architecture content exists (only if not impersonating)
  if (!architectureContent && !scope.isImpersonating) {
    try {
      await assertNotImpersonatingForWrite();
      await ensureArchitectureContent();
      architectureContent = await getArchitectureContentForAdmin();
    } catch {
      // Ignore errors if impersonating
    }
  }

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Architecture Content</h1>
          <p className="text-muted">Manage your architecture section pillars and points</p>
        </div>

        <ArchitectureManager initialData={architectureContent} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
