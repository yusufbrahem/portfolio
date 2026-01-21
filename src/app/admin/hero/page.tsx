import { Container } from "@/components/container";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { getHeroContentForAdmin } from "@/app/actions/hero";
import { HeroManager } from "@/components/admin/hero-manager";

export default async function AdminHeroPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId;

  const heroContent = await getHeroContentForAdmin();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Hero</h1>
          <p className="text-muted">
            This controls the big headline and subheadline on your public portfolio page.
          </p>
        </div>

        {session.user.role === "super_admin" && !portfolioId ? (
          <div className="border border-border bg-panel rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground">Hero</h2>
            <p className="mt-2 text-sm text-muted">
              To edit hero content as a super admin, impersonate a portfolio first.
            </p>
          </div>
        ) : (
          <HeroManager initialData={heroContent} />
        )}
      </div>
    </Container>
  );
}

