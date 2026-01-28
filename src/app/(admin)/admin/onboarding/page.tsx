import { Container } from "@/components/container";
import { requireAuth } from "@/lib/auth";
import { needsOnboarding } from "@/lib/onboarding";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/admin/onboarding-flow";
import { prisma } from "@/lib/prisma";
import { getOnboardingStep } from "@/app/actions/onboarding-step";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireAuth();

  // Super admin doesn't need onboarding
  if (session.user.role === "super_admin") {
    redirect("/admin/users");
  }

  // Check if onboarding is already completed - prevent going back
  const user = await prisma.adminUser.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompleted: true, onboardingStep: true },
  });

  if (user?.onboardingCompleted || user?.onboardingStep === 6) {
    // Onboarding already completed - redirect to dashboard
    redirect("/admin");
  }

  // Get current step to resume from
  const currentStep = await getOnboardingStep();
  
  // GUARD: If step is 0 and onboarding not needed, redirect to dashboard
  if (currentStep === 0) {
    const needsOnboardingCheck = await needsOnboarding();
    if (!needsOnboardingCheck) {
      redirect("/admin");
    }
  }

  // GUARD: Ensure step is valid (1-5) for resuming
  const validStep = Math.max(1, Math.min(5, currentStep || 1)) as 1 | 2 | 3 | 4 | 5;

  return (
    <Container>
      <OnboardingFlow initialStep={validStep} />
    </Container>
  );
}
