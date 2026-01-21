import { Container } from "@/components/container";
import { requireAuth, getImpersonatedPortfolioId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsersWithPortfolios, setImpersonatedPortfolioId } from "@/app/actions/super-admin";
import { Users, Eye, EyeOff } from "lucide-react";
import { revalidatePath } from "next/cache";
import { CreateUserForm } from "@/components/admin/create-user-form";

export default async function AdminUsersPage() {
  // Require authentication and super_admin role
  const session = await requireAuth();
  
  if (session.user.role !== "super_admin") {
    redirect("/admin");
  }

  // Get current impersonation state
  const currentImpersonation = await getImpersonatedPortfolioId();

  // Fetch users with their portfolios
  const users = await getUsersWithPortfolios();

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">Users & Portfolios</h1>
            <p className="text-muted">Manage users and impersonate portfolios (read-only)</p>
          </div>
        </div>

        {/* Create User Form */}
        <CreateUserForm />

        {/* Users Table */}
        <div className="border border-border bg-panel rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({users.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-panel2 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Portfolio</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isCurrentlyImpersonating = currentImpersonation === user.portfolio?.id;
                    return (
                      <tr key={user.id} className="border-b border-border hover:bg-panel2">
                        <td className="px-4 py-3 text-sm text-foreground">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-muted">{user.name || "—"}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              user.role === "super_admin"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-muted/20 text-muted"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">
                          {user.portfolio ? (
                            <div>
                              <div className="text-foreground">{user.portfolio.slug || user.portfolio.id}</div>
                              <div className="text-xs text-muted-disabled">{user.portfolio.id}</div>
                            </div>
                          ) : (
                            <span className="text-muted-disabled">No portfolio</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.portfolio ? (
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                user.portfolio.isPublished
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {user.portfolio.isPublished ? "Published" : "Draft"}
                            </span>
                          ) : (
                            <span className="text-muted-disabled">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {user.portfolio ? (
                            <form
                              action={async () => {
                                "use server";
                                if (isCurrentlyImpersonating) {
                                  await setImpersonatedPortfolioId(null);
                                } else {
                                  await setImpersonatedPortfolioId(user.portfolio!.id);
                                }
                                revalidatePath("/admin/users");
                                revalidatePath("/admin");
                                redirect("/admin/users");
                              }}
                            >
                              <button
                                type="submit"
                                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                                  isCurrentlyImpersonating
                                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                                    : "bg-accent/20 text-accent hover:bg-accent/30"
                                }`}
                              >
                                {isCurrentlyImpersonating ? (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    Stop Impersonating
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3" />
                                    Impersonate
                                  </>
                                )}
                              </button>
                            </form>
                          ) : (
                            <span className="text-muted-disabled text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Container>
  );
}
