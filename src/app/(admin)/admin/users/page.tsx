import { Container } from "@/components/container";
import { requireAuth, getImpersonatedPortfolioId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsersWithPortfolios, setImpersonatedPortfolioId } from "@/app/actions/super-admin";
import { getPendingReviewPortfolios, getPendingReviewCount } from "@/app/actions/portfolio-review";
import { Clock } from "lucide-react";
import { revalidatePath } from "next/cache";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { PortfolioReviewCard } from "@/components/admin/portfolio-review-card";
import { SortableUsersTable } from "@/components/admin/sortable-users-table";

export default async function AdminUsersPage() {
  // Require authentication and super_admin role
  const session = await requireAuth();
  
  if (session.user.role !== "super_admin") {
    redirect("/admin");
  }

  // Get current impersonation state
  const currentImpersonation = await getImpersonatedPortfolioId();

  // Fetch users with their portfolios and pending reviews
  const [users, pendingReviews, pendingCount] = await Promise.all([
    getUsersWithPortfolios(),
    getPendingReviewPortfolios(),
    getPendingReviewCount(),
  ]);

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Users & Portfolios</h1>
            <p className="text-muted">Manage users and impersonate portfolios (read-only)</p>
          </div>
        </div>

        {/* Pending Reviews Section */}
        {pendingCount > 0 && (
          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Pending Reviews ({pendingCount})
                </h2>
              </div>
            </div>
            <div className="space-y-3">
              {pendingReviews.map((portfolio) => (
                <PortfolioReviewCard key={portfolio.id} portfolio={portfolio} />
              ))}
            </div>
          </div>
        )}

        {/* Create User Form */}
        <CreateUserForm />

        {/* Users Table */}
        <SortableUsersTable
          users={users}
          currentImpersonation={currentImpersonation}
          currentUserId={session.user.id}
          onImpersonate={async (portfolioId) => {
            "use server";
            await setImpersonatedPortfolioId(portfolioId);
            revalidatePath("/admin/users");
            revalidatePath("/admin");
            redirect("/admin/users");
          }}
        />
      </div>
    </Container>
  );
}
