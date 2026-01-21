import { Container } from "@/components/container";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "./ui";

export default async function AdminAccountPage() {
  const session = await requireAuth();

  const me = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Account</h1>
          <p className="text-muted">Update your display name and login email.</p>
        </div>

        <AccountForm initialEmail={me?.email || session.user.email} initialName={me?.name || ""} />
      </div>
    </Container>
  );
}

