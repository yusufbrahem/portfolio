import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPersonInfoForAdmin } from "@/app/actions/contact";

export async function GET() {
  await requireAuth();
  const personInfo = await getPersonInfoForAdmin();

  return NextResponse.json({
    name: personInfo?.name || "",
    role: personInfo?.role || "",
  });
}
