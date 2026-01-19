"use server";

import { clearAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function logout() {
  await clearAdminSession();
  redirect("/admin/login");
}
