"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyAccount, updateMyPortfolioSlug } from "@/app/actions/account";
import { uploadAvatar } from "@/app/actions/upload";
import { signOut } from "next-auth/react";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";

export function AccountForm({
  initialEmail,
  initialName,
  initialSlug,
  initialAvatarUrl,
}: {
  initialEmail: string;
  initialName: string;
  initialSlug: string;
  initialAvatarUrl: string | null;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadAvatar(fd);
      setAvatarUrl(result.avatarUrl);
      router.refresh(); // Refresh to update layout header
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload avatar");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await updateMyAccount({ email, name });
        const slugChanged = slug.trim() !== (initialSlug || "").trim();
        if (slugChanged) {
          const updated = await updateMyPortfolioSlug({ slug });
          setSlug(updated.slug);
        }
        if (res.emailChanged) {
          // Force re-login so session token reflects new email
          await signOut({ callbackUrl: "/admin/login" });
          return;
        }
        setSuccess("Saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update account");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload Section */}
      <div className="border border-border bg-panel rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profile Photo</h2>
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-panel2 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted" />
            )}
          </div>
          <div className="flex-1">
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-background text-foreground rounded-lg hover:bg-panel2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isUploading ? "Uploading..." : "Upload Photo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            {uploadError && <p className="mt-2 text-sm text-red-500">{uploadError}</p>}
            <p className="mt-2 text-xs text-muted-disabled">
              PNG, JPEG, or WebP. Max 3MB. Your photo will appear in your portfolio and admin panel.
            </p>
          </div>
        </div>
      </div>

      {/* Account Settings Form */}
      <div className="border border-border bg-panel rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Account Settings</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="name">
                Display name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
                Login email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                required
              />
              <p className="mt-1 text-xs text-muted-disabled">
                If you change your email, you'll be logged out and must sign in again.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1" htmlFor="slug">
              Portfolio URL
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">/portfolio/</span>
              <input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
                placeholder="your-name"
              />
            </div>
            <p className="mt-1 text-xs text-muted-disabled">
              This controls your public URL. It will be normalized to lowercase and hyphens.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : success ? (
            <p className="text-sm text-green-400">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

