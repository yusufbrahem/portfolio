import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPersonInfoForAdmin } from "@/app/actions/contact";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireAuth();
  const portfolioId = session.user.portfolioId;
  if (!portfolioId) {
    return NextResponse.json({ name: "", role: "" });
  }
  const contactMenu = await prisma.portfolioMenu.findFirst({
    where: {
      portfolioId,
      platformMenu: { sectionType: "contact_template", enabled: true },
    },
    select: { platformMenuId: true },
  });
  if (!contactMenu) {
    return NextResponse.json({ name: "", role: "" });
  }
  const personInfo = await getPersonInfoForAdmin(contactMenu.platformMenuId);
  return NextResponse.json({
    name: personInfo?.name || "",
    role: personInfo?.role || "",
  });
}
