import { Container } from "@/components/container";
import { getExperiences } from "@/app/actions/experience";
import { ExperienceManager } from "@/components/admin/experience-manager";

export default async function AdminExperiencePage() {
  const experiences = await getExperiences();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Manage Experience</h1>
          <p className="text-muted">Add, edit, or delete work experience entries</p>
        </div>
        <ExperienceManager initialData={experiences} />
      </div>
    </Container>
  );
}
