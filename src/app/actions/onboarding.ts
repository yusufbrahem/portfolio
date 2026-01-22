"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Mark onboarding as completed for the current user.
 * Server action that can be called from client components.
 */
export async function completeOnboarding(): Promise<void> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true },
  });

  // Revalidate paths to ensure fresh data
  revalidatePath("/admin");
  revalidatePath("/admin/onboarding");
}
