import { Container } from "@/components/container";
import { getPersonInfoForAdmin } from "@/app/actions/contact";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ContactManager } from "@/components/admin/contact-manager";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }
  
  const personInfo = await getPersonInfoForAdmin();

  // Get user's name and email for smart defaults
  let userId = session.user.id;
  if (scope.isImpersonating && scope.portfolioId) {
    const impersonatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: scope.portfolioId },
      select: { userId: true },
    });
    if (impersonatedPortfolio) {
      userId = impersonatedPortfolio.userId;
    }
  }

  const adminUser = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  // Use AdminUser name if available, otherwise use session user name, otherwise use email prefix
  const defaultName = adminUser?.name || session.user.name || adminUser?.email?.split("@")[0] || "";
  const defaultEmail = adminUser?.email || session.user.email || "";

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Contact Information</h1>
          <p className="text-muted">Manage your contact details, email, and LinkedIn</p>
        </div>

        <ContactManager 
          initialData={personInfo} 
          userDefaults={(defaultName || defaultEmail) ? { name: defaultName, email: defaultEmail } : null}
          isReadOnly={scope.isImpersonating} 
        />
      </div>
    </Container>
  );
}
