import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminReadScope } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();

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

  const defaultName = adminUser?.name || session.user.name || adminUser?.email?.split("@")[0] || "";
  const defaultEmail = adminUser?.email || session.user.email || "";

  return NextResponse.json({
    name: defaultName,
    email: defaultEmail,
  });
}
