import { Container } from "@/components/container";
import { getArchitectureContent, ensureArchitectureContent } from "@/app/actions/architecture";
import { ArchitectureManager } from "@/components/admin/architecture-manager";

export const dynamic = "force-dynamic";

export default async function AdminArchitecturePage() {
  let architectureContent = await getArchitectureContent();
  
  // Ensure architecture content exists
  if (!architectureContent) {
    await ensureArchitectureContent();
    architectureContent = await getArchitectureContent();
  }

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Architecture Content</h1>
          <p className="text-muted">Manage your architecture section pillars and points</p>
        </div>

        <ArchitectureManager initialData={architectureContent} />
      </div>
    </Container>
  );
}
