import { Container } from "@/components/container";
import { getArchitectureContentForAdmin, ensureArchitectureContent } from "@/app/actions/architecture";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ArchitectureManager } from "@/components/admin/architecture-manager";
import { SectionIntroEditor } from "@/components/admin/section-intro-editor";
import { SectionVisibilityToggle } from "@/components/admin/section-visibility-toggle";
import { getPortfolioIntros } from "@/app/actions/portfolio-intros";
import { getSectionVisibility } from "@/app/actions/section-visibility";
import { isMenuEnabled } from "@/app/actions/menu-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminArchitecturePage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  const menuEnabled = await isMenuEnabled("architecture");
  if (!menuEnabled) {
    redirect("/admin?message=This section is disabled by the platform.");
  }

  const menu = await prisma.platformMenu.findUnique({
    where: { key: "architecture" },
    select: { id: true, label: true },
  });
  if (!menu) {
    redirect("/admin?message=Section not found.");
  }

  let architectureContent = await getArchitectureContentForAdmin(menu.id);
  if (!architectureContent && !scope.isImpersonating) {
    try {
      await ensureArchitectureContent(menu.id);
      architectureContent = await getArchitectureContentForAdmin(menu.id);
    } catch {
      // ignore
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
        <ArchitectureManager
          initialData={architectureContent}
          isReadOnly={scope.isImpersonating}
        />
      </div>
    </Container>
  );
}
