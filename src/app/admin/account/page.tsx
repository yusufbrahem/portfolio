import { Container } from "@/components/container";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "./ui";

export default async function AdminAccountPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

  // Account email/name always shows YOUR account (not impersonated user's account)
  const me = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  // Portfolio slug/avatar: show impersonated portfolio if impersonating, otherwise YOUR portfolio
  const portfolioId = scope.isImpersonating && scope.portfolioId 
    ? scope.portfolioId 
    : session.user.portfolioId;

  const portfolio = portfolioId
    ? await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        select: { slug: true, id: true },
      })
    : null;

  // Get avatar URL from PersonInfo of the active portfolio (impersonated or your own)
  const personInfo = portfolio?.id
    ? await prisma.personInfo.findUnique({
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
      </div>
    </Container>
  );
}

