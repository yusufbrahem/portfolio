import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export async function verifyAdmin(password: string): Promise<boolean> {
  return password === env.ADMIN_PASSWORD;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set("admin-auth", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function checkAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const auth = cookieStore.get("admin-auth");
  return auth?.value === "authenticated";
}

export async function requireAdmin() {
  const isAuthenticated = await checkAdminAuth();
  if (!isAuthenticated) {
    redirect("/admin/login");
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-auth");
}
