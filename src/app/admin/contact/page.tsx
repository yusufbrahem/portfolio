import { Container } from "@/components/container";
import { getPersonInfo } from "@/app/actions/contact";
import { ContactManager } from "@/components/admin/contact-manager";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const personInfo = await getPersonInfo();

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Contact Information</h1>
          <p className="text-muted">Manage your contact details, email, and LinkedIn</p>
        </div>

        <ContactManager initialData={personInfo} />
      </div>
    </Container>
  );
}
