import { Container } from "@/components/container";
import { getPersonInfoForAdmin } from "@/app/actions/contact";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ContactManager } from "@/components/admin/contact-manager";
import { SectionVisibilityToggle } from "@/components/admin/section-visibility-toggle";
import { getSectionVisibility } from "@/app/actions/section-visibility";
import { isMenuEnabled } from "@/app/actions/menu-helpers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  const menuEnabled = await isMenuEnabled("contact");
  if (!menuEnabled) {
    redirect("/admin?message=This section is disabled by the platform.");
  }

  const menu = await prisma.platformMenu.findUnique({
    where: { key: "contact" },
    select: { id: true, label: true },
  });
  if (!menu) {
    redirect("/admin?message=Section not found.");
  }

  const [personInfo, visibility] = await Promise.all([
    getPersonInfoForAdmin(menu.id),
    getSectionVisibility(),
  ]);

  let userId = session.user.id;
  if (scope.isImpersonating && scope.portfolioId) {
    const impersonated = await prisma.portfolio.findUnique({
      where: { id: scope.portfolioId },
      select: { userId: true },
    });
    if (impersonated) userId = impersonated.userId;
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });
  const defaultName = adminUser?.name || session.user.name || adminUser?.email?.split("@")[0] || "";
  const defaultEmail = adminUser?.email || session.user.email || "";

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Contact Information</h1>
          <p className="text-muted">Manage your contact details, email, and LinkedIn</p>
        </div>
        <SectionVisibilityToggle
          section="contact"
          initialValue={visibility?.showContact ?? true}
          isReadOnly={scope.isImpersonating}
        />
        <ContactManager
          initialData={personInfo}
          userDefaults={(defaultName || defaultEmail) ? { name: defaultName, email: defaultEmail } : null}
          isReadOnly={scope.isImpersonating}
          platformMenuId={menu.id}
        />
      </div>
    </Container>
  );
}
