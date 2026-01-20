import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated session
 * Returns null if not authenticated
 */
export async function getSession() {
  return await auth();
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in server components and server actions
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Get the current user ID from session
 * Throws if not authenticated
 */
export async function getUserId(): Promise<string> {
  const session = await requireAuth();
  return session.user.id;
}

/**
 * Check if user is authenticated (does not redirect)
 * Use this when you need to check auth status without redirecting
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}
