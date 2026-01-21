import { Container } from "@/components/container";
import { getAboutContentForAdmin } from "@/app/actions/about";
import { AboutManager } from "@/components/admin/about-manager";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const aboutContent = await getAboutContentForAdmin();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">About Content</h1>
          <p className="text-muted">Manage your about section content and principles</p>
        </div>

        <AboutManager initialData={aboutContent} />
      </div>
    </Container>
  );
}
