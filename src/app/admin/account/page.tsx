import { Container } from "@/components/container";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "./ui";

export default async function AdminAccountPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

  // Account page always shows YOUR account (not impersonated user's account)
  // But we check impersonation to show a warning if needed
  const me = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  // Always use the super admin's own portfolio (not impersonated)
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { slug: true, id: true },
  });

  // Get avatar URL from PersonInfo of YOUR portfolio (not impersonated)
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

