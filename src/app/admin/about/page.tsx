import { Container } from "@/components/container";
import { getAboutContentForAdmin } from "@/app/actions/about";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { AboutManager } from "@/components/admin/about-manager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }
  
  const aboutContent = await getAboutContentForAdmin();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">About Content</h1>
          <p className="text-muted">Manage your about section content and principles</p>
        </div>

        <AboutManager initialData={aboutContent} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
