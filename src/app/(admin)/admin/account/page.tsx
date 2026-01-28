import { Container } from "@/components/container";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "./ui";
import { ChangePasswordForm } from "./change-password-form";
import { redirect } from "next/navigation";

export default async function AdminAccountPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access account page
  // (Account page is for portfolio management, super admin should use Users page)
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  // When impersonating, show the impersonated user's account info
  // Otherwise, show YOUR account info
  let userId = session.user.id;
  let portfolioId = session.user.portfolioId;

  if (scope.isImpersonating && scope.portfolioId) {
    // Get the user who owns the impersonated portfolio
    const impersonatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: scope.portfolioId },
      select: { userId: true, id: true },
    });
    if (impersonatedPortfolio) {
      userId = impersonatedPortfolio.userId;
      portfolioId = impersonatedPortfolio.id;
    }
  }

  const me = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  const portfolio = portfolioId
    ? await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        select: { slug: true, id: true },
      })
    : null;

  // Get avatar URL from first PersonInfo of the active portfolio (portfolio has many personInfos)
  const personInfo = portfolio?.id
    ? await prisma.personInfo.findFirst({
        where: { portfolioId: portfolio.id },
        select: { avatarUrl: true, updatedAt: true },
      })
    : null;

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Account</h1>
          <p className="text-muted">Update your display name, login email, and profile photo.</p>
        </div>

        <AccountForm
          initialEmail={me?.email || session.user.email}
          initialName={me?.name || ""}
          initialSlug={portfolio?.slug || ""}
          initialAvatarUrl={(personInfo as any)?.avatarUrl || null}
          initialAvatarUpdatedAt={(personInfo as any)?.updatedAt || null}
        />

        <ChangePasswordForm isImpersonating={scope.isImpersonating} />
      </div>
    </Container>
  );
}

