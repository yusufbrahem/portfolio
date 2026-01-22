"use client";

import { useState, useTransition, useEffect } from "react";
import { CheckCircle, Circle, ArrowRight, Lock, User, Sparkles, FileText, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/onboarding";
import { updateOnboardingStep } from "@/app/actions/onboarding-step";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, title: "Change Password", icon: Lock },
  { id: 2, title: "Profile Information", icon: User },
  { id: 3, title: "Hero Section", icon: Sparkles },
  { id: 4, title: "Add Content", icon: FileText },
  { id: 5, title: "Review & Request", icon: Eye },
] as const;

type OnboardingFlowProps = {
  initialStep?: OnboardingStep;
};

export function OnboardingFlow({ initialStep = 1 }: OnboardingFlowProps) {
  // GUARD: Ensure initialStep is valid (1-5)
  const validInitialStep = Math.max(1, Math.min(5, initialStep || 1)) as OnboardingStep;
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(validInitialStep);
  const [completedSteps, setCompletedSteps] = useState<Set<OnboardingStep>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Initialize completed steps based on current step
  useEffect(() => {
    const completed = new Set<OnboardingStep>();
    for (let i = 1; i < initialStep; i++) {
      completed.add(i as OnboardingStep);
    }
    setCompletedSteps(completed);
  }, [initialStep]);

  const handleStepComplete = (step: OnboardingStep) => {
    startTransition(async () => {
      try {
        // GUARD: Prevent going back - only allow forward progress
        if (step < currentStep) {
          console.warn("Cannot go back to previous step");
          return;
        }

        // Persist step progress immediately after data is saved
        if (step < 5) {
          const nextStep = (step + 1) as OnboardingStep;
          await updateOnboardingStep(nextStep);
          setCompletedSteps((prev) => new Set([...prev, step]));
          setCurrentStep(nextStep);
        } else {
          // Final step - complete onboarding
          await updateOnboardingStep(6); // Mark as completed
          await completeOnboarding();
          // Use window.location for a hard redirect to avoid refresh loops
          window.location.href = "/admin";
        }
      } catch (error) {
        console.error("Failed to save onboarding progress:", error);
      }
    });
  };

  // Prevent going back - no back navigation allowed
  // Steps are disabled if not yet reached

  const progress = (completedSteps.size / STEPS.length) * 100;

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Welcome! Let's set up your portfolio</h1>
        <div className="flex items-center gap-2 mb-4">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(step.id as OnboardingStep);
            const isCurrent = currentStep === step.id;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : isCurrent
                        ? "bg-accent border-accent text-foreground"
                        : step.id < currentStep
                        ? "bg-panel border-border text-muted opacity-50 cursor-not-allowed"
                        : "bg-panel border-border text-muted opacity-30"
                    }`}
                    title={step.id < currentStep ? "Completed" : step.id > currentStep ? "Not yet reached" : "Current step"}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`mt-2 text-xs text-center ${isCurrent ? "text-foreground font-medium" : "text-muted"}`}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 -mt-5 ${
                      isCompleted ? "bg-green-500" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted mt-2 text-center">
          Step {currentStep} of {STEPS.length}
        </p>
      </div>

      {/* Step Content */}
      <div className="border border-border bg-panel rounded-lg p-6">
        {currentStep === 1 && (
          <OnboardingStep1 onComplete={() => handleStepComplete(1)} />
        )}
        {currentStep === 2 && (
          <OnboardingStep2 onComplete={() => handleStepComplete(2)} />
        )}
        {currentStep === 3 && (
          <OnboardingStep3 onComplete={() => handleStepComplete(3)} />
        )}
        {currentStep === 4 && (
          <OnboardingStep4 onComplete={() => handleStepComplete(4)} />
        )}
        {currentStep === 5 && (
          <OnboardingStep5 onComplete={() => handleStepComplete(5)} />
        )}
      </div>
    </div>
  );
}

// Step 1: Change Password
function OnboardingStep1({ onComplete }: { onComplete: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [minPasswordLength, setMinPasswordLength] = useState(6);

  useEffect(() => {
    import("@/app/actions/password-validation")
      .then(({ getMinPasswordLengthAction }) => getMinPasswordLengthAction())
      .then(setMinPasswordLength)
      .catch(() => setMinPasswordLength(6));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < minPasswordLength) {
      setError(`Password must be at least ${minPasswordLength} characters long`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    startTransition(async () => {
      try {
        const { changeMyPassword } = await import("@/app/actions/account");
        await changeMyPassword({ currentPassword, newPassword });
        // Step 1 complete - password changed, now mark step as complete
        onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to change password");
      }
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Lock className="h-5 w-5" />
        Step 1: Change Your Password
      </h2>
      <p className="text-muted mb-6">
        For security, please change your password from the default one.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Current password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
            required
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            New password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
            required
            minLength={minPasswordLength}
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-muted">
            Must be at least {minPasswordLength} characters long.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Confirm new password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
            required
            minLength={minPasswordLength}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}

// Step 2: Profile Information
function OnboardingStep2({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Fetch user defaults
    fetch("/api/user-defaults")
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setName(data.name);
        if (data.email) {
          // Email is read-only and comes from account
          setEmail(data.email);
        }
        // Auto-suggest slug from name or email
        if (data.name) {
          const suggestedSlug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          setSlug(suggestedSlug);
        } else if (data.email) {
          const suggestedSlug = data.email.split("@")[0].toLowerCase().replace(/[^a-z0-9-]/g, "");
          setSlug(suggestedSlug);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!linkedIn.match(/^https?:\/\/.+/)) {
      setError("LinkedIn URL must start with http:// or https://");
      return;
    }

    if (!slug || !slug.trim()) {
      setError("Portfolio slug is required");
      return;
    }

    startTransition(async () => {
      try {
        // Update person info (don't update email - it's read-only and tied to account)
        const { updatePersonInfo } = await import("@/app/actions/contact");
        await updatePersonInfo({ 
          name: name.trim(), 
          role: role.trim(), 
          location: location.trim(), 
          email: email.trim(), // This is the display email for portfolio, not the account email
          linkedIn: linkedIn.trim() 
        });

        // Update portfolio slug
        const { updateMyPortfolioSlug } = await import("@/app/actions/account");
        await updateMyPortfolioSlug({ slug: slug.trim() });

        onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save profile");
      }
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <User className="h-5 w-5" />
        Step 2: Profile Information
      </h2>
      <p className="text-muted mb-6">
        Tell us about yourself. This information will appear on your portfolio.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Role / Job Title *
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Location *
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA"
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email * <span className="text-xs text-muted font-normal">(from your account)</span>
          </label>
          <input
            type="email"
            value={email}
            readOnly
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-panel text-muted rounded-lg disabled:opacity-50 cursor-not-allowed"
            required
          />
          <p className="mt-1 text-xs text-muted">
            This email is from your account and cannot be changed here. It will appear on your portfolio.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            LinkedIn URL *
          </label>
          <input
            type="url"
            value={linkedIn}
            onChange={(e) => setLinkedIn(e.target.value)}
            placeholder="https://www.linkedin.com/in/..."
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
            required
            pattern="https?://.+"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Portfolio URL Slug *
          </label>
          <div className="flex items-center gap-2">
            <span className="text-muted">/portfolio/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="your-name"
              disabled={isPending}
              className="flex-1 px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
              required
              pattern="[a-z0-9-]+"
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            This will be your portfolio URL: /portfolio/{slug || "your-name"}
          </p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}

// Step 3: Hero Section
function OnboardingStep3({ onComplete }: { onComplete: () => void }) {
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [highlights, setHighlights] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Fetch person info to pre-fill headline
    fetch("/api/person-info")
      .then((res) => res.json())
      .then((data) => {
        if (data.name && data.role) {
          setHeadline(`${data.name} — ${data.role}`);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const highlightsArray = highlights
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        const { updateHeroContent } = await import("@/app/actions/hero");
        await updateHeroContent({
          headline: headline.trim(),
          subheadline: subheadline.trim(),
          highlights: highlightsArray,
        });
        // Step 3 complete - data is saved, now mark step as complete
        onComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save hero");
      }
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        Step 3: Hero Section
      </h2>
      <p className="text-muted mb-6">
        Create your portfolio headline. This appears at the top of your portfolio.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Headline *
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg disabled:opacity-50"
            required
          />
          {headline && headline.includes("—") && (
            <p className="mt-1.5 text-xs text-muted flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-accent" />
              <span>Suggested from your profile</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Subheadline *
          </label>
          <textarea
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg min-h-[96px] disabled:opacity-50"
            required
            placeholder="A brief description of who you are and what you do..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Highlights (one per line)
          </label>
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg min-h-[120px] disabled:opacity-50"
            placeholder="Secure APIs&#10;Identity & access&#10;Transaction integrity"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}

// Step 4: Add Content Section
function OnboardingStep4({ onComplete }: { onComplete: () => void }) {
  const [selectedSection, setSelectedSection] = useState<"skills" | "projects" | "experience" | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleContinue = () => {
    if (selectedSection) {
      // Save step progress before redirecting
      startTransition(async () => {
        try {
          await updateOnboardingStep(4); // Mark step 4 as current
          // Redirect to the selected section after saving
          router.push(`/admin/${selectedSection}?fromOnboarding=true`);
        } catch (error) {
          console.error("Failed to save progress:", error);
        }
      });
    }
  };

  const handleSkip = () => {
    // Allow skipping - user can add content later
    // Step 4 skipped - mark as complete and move to next step
    onComplete();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Step 4: Add Content
      </h2>
      <p className="text-muted mb-6">
        Choose one content section to add. You can add more later from your dashboard.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setSelectedSection("skills")}
          className={`p-6 border-2 rounded-lg text-left transition-colors ${
            selectedSection === "skills"
              ? "border-accent bg-accent/10"
              : "border-border bg-panel hover:border-accent/50"
          }`}
        >
          <h3 className="font-semibold text-foreground mb-2">Skills</h3>
          <p className="text-sm text-muted">Showcase your technical skills and expertise</p>
        </button>
        <button
          type="button"
          onClick={() => setSelectedSection("projects")}
          className={`p-6 border-2 rounded-lg text-left transition-colors ${
            selectedSection === "projects"
              ? "border-accent bg-accent/10"
              : "border-border bg-panel hover:border-accent/50"
          }`}
        >
          <h3 className="font-semibold text-foreground mb-2">Projects</h3>
          <p className="text-sm text-muted">Highlight your best work and projects</p>
        </button>
        <button
          type="button"
          onClick={() => setSelectedSection("experience")}
          className={`p-6 border-2 rounded-lg text-left transition-colors ${
            selectedSection === "experience"
              ? "border-accent bg-accent/10"
              : "border-border bg-panel hover:border-accent/50"
          }`}
        >
          <h3 className="font-semibold text-foreground mb-2">Experience</h3>
          <p className="text-sm text-muted">Share your professional experience</p>
        </button>
      </div>

      <div className="mt-6 flex gap-4">
        {selectedSection ? (
          <button
            type="button"
            onClick={handleContinue}
            className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors"
          >
            Go to {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)} Section
            <ArrowRight className="h-4 w-4 inline ml-2" />
          </button>
        ) : (
          <p className="text-sm text-muted">
            Select a content section above to add, or skip this step and add content later.
          </p>
        )}
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-2 border border-border bg-panel text-foreground rounded-lg hover:bg-panel2 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

// Step 5: Review & Request Publication
function OnboardingStep5({ onComplete }: { onComplete: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRequestPublication = () => {
    setError(null);
    startTransition(async () => {
      try {
        const { requestPortfolioPublication } = await import("@/app/actions/portfolio");
        const { completeOnboarding } = await import("@/app/actions/onboarding");
        const { updateOnboardingStep } = await import("@/app/actions/onboarding-step");
        
        // Request publication (does NOT trigger onboarding - decoupled)
        await requestPortfolioPublication();
        
        // Complete onboarding and mark step as 6
        await updateOnboardingStep(6);
        await completeOnboarding();
        
        // Use window.location for a hard redirect to avoid refresh loops
        window.location.href = "/admin";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to request publication");
      }
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Eye className="h-5 w-5" />
        Step 5: Review & Request Publication
      </h2>
      <p className="text-muted mb-6">
        Great! You've set up your portfolio. Review your work and request publication when ready.
      </p>

      <div className="space-y-4 mb-6">
        <div className="p-4 border border-border bg-panel rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">What happens next?</h3>
          <ul className="text-sm text-muted space-y-1 list-disc list-inside">
            <li>Your portfolio will be submitted for review</li>
            <li>You'll receive a notification once it's been reviewed</li>
            <li>Once approved, your portfolio will be live and accessible to the public</li>
          </ul>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleRequestPublication}
          disabled={isPending}
          className="px-6 py-3 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
        >
          {isPending ? "Submitting..." : "Request Publication"}
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/admin";
          }}
          className="px-6 py-3 border border-border bg-panel text-foreground rounded-lg hover:bg-panel2 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
