import { Container } from "@/components/container";
import { getAboutContentForAdmin } from "@/app/actions/about";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { AboutManager } from "@/components/admin/about-manager";
import { SectionVisibilityToggle } from "@/components/admin/section-visibility-toggle";
import { getSectionVisibility } from "@/app/actions/section-visibility";
import { isMenuEnabled } from "@/app/actions/menu-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  const menuEnabled = await isMenuEnabled("about");
  if (!menuEnabled) {
    redirect("/admin?message=This section is disabled by the platform.");
  }

  const menu = await prisma.platformMenu.findUnique({
    where: { key: "about" },
    select: { id: true, label: true },
  });
  if (!menu) {
    redirect("/admin?message=Section not found.");
  }

  const [aboutContent, visibility] = await Promise.all([
    getAboutContentForAdmin(menu.id),
    getSectionVisibility(),
  ]);

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">About Content</h1>
          <p className="text-muted">Manage your about section content and principles</p>
        </div>
        <SectionVisibilityToggle
          section="about"
          initialValue={visibility?.showAbout ?? true}
          isReadOnly={scope.isImpersonating}
        />
        <AboutManager
          initialData={aboutContent}
          isReadOnly={scope.isImpersonating}
          platformMenuId={menu.id}
        />
      </div>
    </Container>
  );
}
