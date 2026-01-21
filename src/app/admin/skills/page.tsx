import { Container } from "@/components/container";
import { getSkillGroupsForAdmin } from "@/app/actions/skills";
import { getAdminReadScope } from "@/lib/auth";
import { SkillsManager } from "@/components/admin/skills-manager";

export default async function AdminSkillsPage() {
  const skillGroups = await getSkillGroupsForAdmin();
  const scope = await getAdminReadScope();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Manage Skills</h1>
          <p className="text-muted">Add, edit, or delete skill groups and individual skills</p>
        </div>
        <SkillsManager initialData={skillGroups} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
