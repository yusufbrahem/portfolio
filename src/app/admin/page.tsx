import { Container } from "@/components/container";
import Link from "next/link";
import { Code, FolderOpen, Briefcase, User, Building2, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { getHeroContentForAdmin } from "@/app/actions/hero";
import { HeroManager } from "@/components/admin/hero-manager";
import { redirect } from "next/navigation";
import { needsOnboarding } from "@/lib/onboarding";
import { PublicationRequest } from "@/components/admin/publication-request";
import { PortfolioVisibilityToggle } from "@/components/admin/portfolio-visibility-toggle";
import { getPortfolioVisibility } from "@/app/actions/portfolio-visibility";

export default async function AdminDashboard() {
  // Require authentication before accessing any data
  const session = await requireAuth();
  
  // Get active portfolio scope (supports super-admin impersonation)
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId;
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access dashboard
  if (session.user.role === "super_admin" && !portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  // Check if user needs onboarding (only for normal users, not when impersonating)
  // Only redirect if onboarding is not completed
  if (session.user.role !== "super_admin" && !scope.isImpersonating) {
    const user = await prisma.adminUser.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true, onboardingStep: true },
    });

    // Only redirect if onboarding is not completed (step !== 6)
    if (!user?.onboardingCompleted && user?.onboardingStep !== 6) {
      const needsOnboardingCheck = await needsOnboarding();
      if (needsOnboardingCheck) {
        redirect("/admin/onboarding");
      }
    }
  }

  // Build where clause: if portfolioId is set, filter by it; otherwise super admin sees all
  const whereClause = portfolioId ? { portfolioId } : (session.user.role === "super_admin" ? {} : { portfolioId: session.user.portfolioId || "none" });

  const [skillsCount, projectsCount, experienceCount, aboutContent, architectureContent, personInfo, heroContent, portfolio, portfolioVisibility] = await Promise.all([
    // Skills count: filter by portfolioId through skillGroup
    prisma.skill.count({
      where: {
        skillGroup: whereClause,
      },
    }),
    // Projects count: direct portfolioId filter
    prisma.project.count({
      where: whereClause,
    }),
    // Experience count: direct portfolioId filter
    prisma.experience.count({
      where: whereClause,
    }),
    // About content: findFirst (portfolio has many aboutContents per menu; dashboard shows first for counts)
    portfolioId
      ? prisma.aboutContent.findFirst({ where: { portfolioId } })
      : session.user.role === "super_admin"
      ? null
      : prisma.aboutContent.findFirst({ where: { portfolioId: session.user.portfolioId || "none" } }),
    // Architecture content: findFirst (portfolio has many architectureContents per menu)
    portfolioId
      ? prisma.architectureContent.findFirst({ where: { portfolioId } })
      : session.user.role === "super_admin"
      ? null
      : prisma.architectureContent.findFirst({ where: { portfolioId: session.user.portfolioId || "none" } }),
    // Person info: findFirst (portfolio has many personInfos per contact menu; dashboard shows first for overview)
    portfolioId
      ? prisma.personInfo.findFirst({ where: { portfolioId }, select: { id: true, name: true, role: true, location: true, avatarUrl: true, updatedAt: true } })
      : session.user.role === "super_admin"
      ? null
      : prisma.personInfo.findFirst({ where: { portfolioId: session.user.portfolioId || "none" }, select: { id: true, name: true, role: true, location: true, avatarUrl: true, updatedAt: true } }),
    getHeroContentForAdmin(),
    // Get portfolio status for publication request
    portfolioId
      ? prisma.portfolio.findUnique({ 
          where: { id: portfolioId }, 
          select: { status: true, rejectionReason: true } 
        })
      : session.user.portfolioId
      ? prisma.portfolio.findUnique({ 
          where: { id: session.user.portfolioId }, 
          select: { status: true, rejectionReason: true } 
        })
      : null,
    // Get portfolio visibility
    getPortfolioVisibility(),
  ]);

  const principlesCount = aboutContent
    ? await prisma.aboutPrinciple.count({ where: { aboutContentId: aboutContent.id } })
    : 0;
  const pillarsCount = architectureContent
    ? await prisma.architecturePillar.count({ where: { architectureContentId: architectureContent.id } })
    : 0;

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted">Manage your portfolio content</p>
        </div>

        {/* Portfolio Visibility Toggle */}
        {portfolioVisibility && (
          <PortfolioVisibilityToggle
            initialValue={portfolioVisibility.isPublic ?? true}
            isReadOnly={scope.isImpersonating}
          />
        )}

        {/* Publication Request Section */}
        {portfolio && (
          <PublicationRequest 
            currentStatus={portfolio.status as "DRAFT" | "READY_FOR_REVIEW" | "REJECTED" | "PUBLISHED" | null}
            rejectionReason={portfolio.rejectionReason}
            showFullCard={true}
          />
        )}

        {/* Profile Overview Card */}
        {personInfo && (
          <div className="border border-border bg-panel rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Profile Overview</h2>
            <div className="flex items-center gap-6">
              {(personInfo as any)?.avatarUrl ? (
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-panel2 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(personInfo as any).avatarUrl}
                    alt={`${personInfo.name} avatar`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full border-2 border-border bg-panel2 flex items-center justify-center flex-shrink-0">
                  <User className="h-12 w-12 text-muted" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-foreground">{personInfo.name}</h3>
                <p className="text-muted">{personInfo.role}</p>
                <p className="text-sm text-muted-disabled mt-1">{personInfo.location}</p>
                <Link
                  href="/admin/account"
                  className="mt-3 inline-block text-sm text-accent hover:underline"
                >
                  Edit profile →
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/skills"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Code className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Skills</h2>
            </div>
            <p className="text-sm text-muted">{skillsCount} skills</p>
          </Link>

          <Link
            href="/admin/projects"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Projects</h2>
            </div>
            <p className="text-sm text-muted">{projectsCount} projects</p>
          </Link>

          <Link
            href="/admin/experience"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Experience</h2>
            </div>
            <p className="text-sm text-muted">{experienceCount} entries</p>
          </Link>

          <Link
            href="/admin/about"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <User className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">About</h2>
            </div>
            <p className="text-sm text-muted">
              {aboutContent ? `${principlesCount} principles` : "Not configured"}
            </p>
          </Link>

          <Link
            href="/admin/architecture"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Architecture</h2>
            </div>
            <p className="text-sm text-muted">
              {architectureContent ? `${pillarsCount} pillars` : "Not configured"}
            </p>
          </Link>

          <Link
            href="/admin/contact"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            </div>
            <p className="text-sm text-muted">
              {personInfo ? "Configured" : "Not configured"}
            </p>
          </Link>
        </div>

        <div className="pt-2">
          {session.user.role === "super_admin" && !portfolioId ? (
            <div className="border border-border bg-panel rounded-lg p-6">
              <h2 className="text-lg font-semibold text-foreground">Hero</h2>
              <p className="mt-2 text-sm text-muted">
                To edit hero content as a super admin, impersonate a portfolio first (read-only mode prevents writes).
                Stop impersonation to write, then switch to the target user to edit their hero.
              </p>
            </div>
          ) : (
            <HeroManager 
              initialData={heroContent} 
              personInfo={personInfo ? { name: personInfo.name, role: personInfo.role } : null}
              isReadOnly={scope.isImpersonating} 
            />
          )}
        </div>

      </div>
    </Container>
  );
}
