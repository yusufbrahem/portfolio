import { Container } from "@/components/container";
import { getPersonInfoForAdmin } from "@/app/actions/contact";
import { getAdminReadScope, requireAuth } from "@/lib/auth";
import { ContactManager } from "@/components/admin/contact-manager";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const session = await requireAuth();
  const scope = await getAdminReadScope();
  
  // PLATFORM HARDENING: Super admin (not impersonating) cannot access portfolio pages
  if (session.user.role === "super_admin" && !scope.portfolioId) {
    redirect("/admin/users?message=Super admin accounts are for platform management only.");
  }
  
  const personInfo = await getPersonInfoForAdmin();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Contact Information</h1>
          <p className="text-muted">Manage your contact details, email, and LinkedIn</p>
        </div>

        <ContactManager initialData={personInfo} isReadOnly={scope.isImpersonating} />
      </div>
    </Container>
  );
}
