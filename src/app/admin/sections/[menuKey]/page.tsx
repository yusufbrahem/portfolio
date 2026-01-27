import { Container } from "@/components/container";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMenuEditorData } from "@/app/actions/menu-blocks";
import { GenericMenuEditor } from "@/components/admin/generic-menu-editor";
import { CANONICAL_ADMIN_ROUTES } from "@/lib/section-types";

type PageProps = {
  params: Promise<{ menuKey: string }>;
};

export default async function AdminSectionPage({ params }: PageProps) {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  const portfolioId = scope.portfolioId ?? session.user.portfolioId;

  if (!portfolioId) {
    redirect("/admin");
  }

  const { menuKey } = await params;
  const data = await getMenuEditorData(portfolioId, menuKey);

  if (!data) {
    return (
      <Container>
        <div className="border border-border bg-panel rounded-lg p-8 max-w-lg">
          <h1 className="text-xl font-semibold text-foreground mb-2">Menu not found</h1>
          <p className="text-muted mb-6">This menu does not exist or you cannot edit it.</p>
          <Link href="/admin" className="text-sm text-accent hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </Container>
    );
  }

  // Legacy menus: redirect to the old section editor so existing bookmarks still work
  if (!data.isComponentBased && data.platformMenu.sectionType) {
    const legacyRoute = CANONICAL_ADMIN_ROUTES[menuKey];
    if (legacyRoute) {
      redirect(legacyRoute);
    }
  }

  if (!data.isComponentBased) {
    return (
      <Container>
        <div className="border border-border bg-panel rounded-lg p-8 max-w-lg">
          <h1 className="text-xl font-semibold text-foreground mb-2">Legacy menu</h1>
          <p className="text-muted mb-6">
            This menu uses the legacy section model. Use Menu Configuration to enable component-based menus.
          </p>
          <Link href="/admin" className="text-sm text-accent hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <GenericMenuEditor
        menuLabel={data.platformMenu.label}
        portfolioId={portfolioId}
        blocks={data.blocks}
      />
    </Container>
  );
}
