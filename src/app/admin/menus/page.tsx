import { Container } from "@/components/container";
import { requireAuth, getAdminReadScope } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPortfolioMenus } from "@/app/actions/portfolio-menu";
import { PortfolioMenuManager } from "@/components/admin/portfolio-menu-manager";

export default async function AdminMenusPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }

  const portfolioId = scope.portfolioId || session.user.portfolioId;
  
  if (!portfolioId) {
    redirect("/admin");
  }

  const menus = await getPortfolioMenus(portfolioId);

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Menu Configuration</h1>
          <p className="text-muted">
            Reorder and show/hide menus in your portfolio navigation.
          </p>
        </div>

        <PortfolioMenuManager menus={menus} portfolioId={portfolioId} />
      </div>
    </Container>
  );
}
