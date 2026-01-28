import { Container } from "@/components/container";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPlatformMenus } from "@/app/actions/platform-menu";
import { PlatformMenuManager } from "@/components/admin/platform-menu-manager";

export default async function AdminPlatformMenusPage() {
  const session = await requireAuth();
  
  if (session.user.role !== "super_admin") {
    redirect("/admin");
  }

  const menus = await getPlatformMenus();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Platform Menus</h1>
          <p className="text-muted">
            Manage global menu definitions. These menus are available to all portfolios.
          </p>
        </div>

        <PlatformMenuManager menus={menus} />
      </div>
    </Container>
  );
}
