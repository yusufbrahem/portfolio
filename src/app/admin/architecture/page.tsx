import { Container } from "@/components/container";
import { getArchitectureContentForAdmin, ensureArchitectureContent } from "@/app/actions/architecture";
import { getAdminReadScope, assertNotImpersonatingForWrite, requireAuth } from "@/lib/auth";
import { ArchitectureManager } from "@/components/admin/architecture-manager";
import { SectionIntroEditor } from "@/components/admin/section-intro-editor";
import { SectionVisibilityToggle } from "@/components/admin/section-visibility-toggle";
import { getPortfolioIntros } from "@/app/actions/portfolio-intros";
import { getSectionVisibility } from "@/app/actions/section-visibility";
import { isMenuEnabled } from "@/app/actions/menu-helpers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminArchitecturePage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  // SINGLE SOURCE OF TRUTH: Check if menu is enabled
  const menuEnabled = await isMenuEnabled("architecture");
  if (!menuEnabled) {
    redirect("/admin?message=This section is disabled by the platform.");
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

  const [portfolioIntros, visibility] = await Promise.all([
    getPortfolioIntros(),
    getSectionVisibility(),
  ]);

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Architecture Content</h1>
          <p className="text-muted">Manage your architecture section pillars and points</p>
        </div>

        <SectionVisibilityToggle
          section="architecture"
          initialValue={visibility?.showArchitecture ?? true}
          isReadOnly={scope.isImpersonating}
        />

        <SectionIntroEditor
          section="architecture"
          initialValue={portfolioIntros?.architectureIntro}
          isReadOnly={scope.isImpersonating}
        />

        <ArchitectureManager initialData={architectureContent} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
