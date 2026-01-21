import { Container } from "@/components/container";
import { getArchitectureContentForAdmin, ensureArchitectureContent } from "@/app/actions/architecture";
import { getAdminReadScope, assertNotImpersonatingForWrite } from "@/lib/auth";
import { ArchitectureManager } from "@/components/admin/architecture-manager";

export const dynamic = "force-dynamic";

export default async function AdminArchitecturePage() {
  const scope = await getAdminReadScope();
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
