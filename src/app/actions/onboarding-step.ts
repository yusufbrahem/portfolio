"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get current onboarding step for the user.
 * Returns 0 if not started, 1-5 for current step, 6 if completed.
 */
export async function getOnboardingStep(): Promise<number> {
  const session = await getSession();
  if (!session?.user) {
    return 0;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, onboardingCompleted: true },
  });

  if (!user) {
    return 0;
  }

  // If completed, return 6
  if (user.onboardingCompleted) {
    return 6;
  }

  return user.onboardingStep || 0;
}

/**
 * Update onboarding step for the current user.
 * Step: 0 = not started, 1-5 = current step, 6 = completed
 */
export async function updateOnboardingStep(step: number): Promise<void> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Validate step range
  if (step < 0 || step > 6) {
    throw new Error("Invalid onboarding step");
  }

  // GUARD: Prevent going backwards (only allow forward progress)
  const currentUser = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { onboardingStep: true, onboardingCompleted: true },
  });

  if (currentUser?.onboardingCompleted || currentUser?.onboardingStep === 6) {
    throw new Error("Onboarding already completed - cannot modify step");
  }

  // Only allow forward progress (step must be >= current step, or step 6 for completion)
  if (currentUser && step < currentUser.onboardingStep && step !== 6) {
    throw new Error("Cannot go back to previous step");
  }

  await prisma.adminUser.update({
    where: { id: session.user.id },
    data: { 
      onboardingStep: step,
      // If step is 6, also mark as completed
      onboardingCompleted: step === 6,
    },
  });

  revalidatePath("/admin/onboarding");
  revalidatePath("/admin");
}
