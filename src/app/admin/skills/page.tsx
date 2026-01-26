import { Container } from "@/components/container";
import { getSkillGroupsForAdmin } from "@/app/actions/skills";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { SkillsManager } from "@/components/admin/skills-manager";
import { SectionIntroEditor } from "@/components/admin/section-intro-editor";
import { getPortfolioIntros } from "@/app/actions/portfolio-intros";
import { redirect } from "next/navigation";

export default async function AdminSkillsPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }
  
  const [skillGroups, portfolioIntros] = await Promise.all([
    getSkillGroupsForAdmin(),
    getPortfolioIntros(),
  ]);

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Manage Skills</h1>
          <p className="text-muted">Add, edit, or delete skill groups and individual skills</p>
        </div>
        
        <SectionIntroEditor
          section="skills"
          initialValue={portfolioIntros?.skillsIntro}
          isReadOnly={scope.isImpersonating}
        />
        
        <SkillsManager initialData={skillGroups} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
