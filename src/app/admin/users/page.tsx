import { Container } from "@/components/container";
import { requireAuth, getImpersonatedPortfolioId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsersWithPortfolios, setImpersonatedPortfolioId, togglePortfolioPublish } from "@/app/actions/super-admin";
import { Users, Eye, EyeOff, ExternalLink, Globe, Lock } from "lucide-react";
import { revalidatePath } from "next/cache";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { DeleteUserButton } from "@/components/admin/delete-user-button";
import { ResetPasswordButton } from "@/components/admin/reset-password-button";
import Link from "next/link";

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
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Avatar</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Portfolio</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-muted text-sm">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isCurrentlyImpersonating = currentImpersonation === user.portfolio?.id;
                    const avatarUrl = (user.portfolio as any)?.personInfo?.avatarUrl;
                    const avatarUpdatedAt = (user.portfolio as any)?.personInfo?.updatedAt;
                    const avatarSrc = avatarUrl && avatarUpdatedAt
                      ? `${avatarUrl}?t=${new Date(avatarUpdatedAt).getTime()}`
                      : avatarUrl || null;
                    return (
                      <tr key={user.id} className="border-b border-border hover:bg-panel2/50 transition-colors">
                        <td className="px-3 py-2">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-panel2 flex items-center justify-center flex-shrink-0">
                            {avatarSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatarSrc}
                                alt={`${user.name || user.email} avatar`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Users className="h-4 w-4 text-muted" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-foreground font-medium">{user.email}</td>
                        <td className="px-3 py-2 text-xs text-muted">{user.name || "—"}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              user.role === "super_admin"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-muted/10 text-muted border border-border/50"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted">
                          {user.portfolio ? (
                            <div>
                              <div className="text-foreground font-medium">
                                {user.portfolio.slug || user.email.split("@")[0] || "Portfolio"}
                              </div>
                              {user.portfolio.slug && (
                                <div className="text-xs text-muted-disabled mt-0.5">{user.email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-disabled">No portfolio</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {user.portfolio ? (
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  user.portfolio.isPublished
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                }`}
                              >
                                {user.portfolio.isPublished ? "Published" : "Draft"}
                              </span>
                              {user.portfolio.slug && (
                                <form
                                  action={async () => {
                                    "use server";
                                    await togglePortfolioPublish(user.portfolio!.id, !user.portfolio!.isPublished);
                                    revalidatePath("/admin/users");
                                  }}
                                  className="inline"
                                >
                                  <button
                                    type="submit"
                                    className="text-xs text-muted hover:text-foreground transition-colors p-0.5"
                                    title={user.portfolio!.isPublished ? "Unpublish" : "Publish"}
                                  >
                                    {user.portfolio!.isPublished ? (
                                      <Lock className="h-3 w-3" />
                                    ) : (
                                      <Globe className="h-3 w-3" />
                                    )}
                                  </button>
                                </form>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-disabled text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {user.portfolio ? (
                              <>
                                {user.portfolio.slug && (
                                  <Link
                                    href={`/portfolio/${user.portfolio.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded text-xs font-medium bg-muted/10 text-muted hover:bg-muted/20 hover:text-foreground border border-border/50 transition-all flex items-center gap-1"
                                    title="View portfolio"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span className="hidden sm:inline">View</span>
                                  </Link>
                                )}
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
                                  className="inline"
                                >
                                  <button
                                    type="submit"
                                    className={`px-2 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 border ${
                                      isCurrentlyImpersonating
                                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 hover:border-yellow-500/50"
                                        : "bg-accent/10 text-accent border-accent/30 hover:bg-accent/20 hover:border-accent/50"
                                    }`}
                                    title={isCurrentlyImpersonating ? "Stop impersonating" : "Impersonate user"}
                                  >
                                    {isCurrentlyImpersonating ? (
                                      <>
                                        <EyeOff className="h-3 w-3" />
                                        <span className="hidden sm:inline">Stop</span>
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-3 w-3" />
                                        <span className="hidden sm:inline">Impersonate</span>
                                      </>
                                    )}
                                  </button>
                                </form>
                              </>
                            ) : null}
                            <ResetPasswordButton userId={user.id} userEmail={user.email} />
                            {user.id !== session.user.id && <DeleteUserButton userId={user.id} />}
                            {!user.portfolio && <span className="text-muted-disabled text-xs">—</span>}
                          </div>
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
