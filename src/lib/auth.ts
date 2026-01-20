import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is not set. Please set it in your .env file."
    );
  }
  return password;
}

export async function verifyAdmin(password: string): Promise<boolean> {
  const adminPassword = getAdminPassword();
  return password === adminPassword;
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
