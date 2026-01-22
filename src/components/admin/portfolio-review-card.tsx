"use client";

import { useState, useTransition } from "react";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { approvePortfolio, rejectPortfolio } from "@/app/actions/portfolio-review";
import { useRouter } from "next/navigation";

type PortfolioReviewCardProps = {
  portfolio: {
    id: string;
    slug: string | null;
    status: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
    personInfo: {
      name: string;
      role: string;
      avatarUrl: string | null;
      updatedAt: Date;
    } | null;
  };
};

export function PortfolioReviewCard({ portfolio }: PortfolioReviewCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      try {
        await approvePortfolio(portfolio.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to approve portfolio");
      }
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await rejectPortfolio(portfolio.id, rejectionReason);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reject portfolio");
      }
    });
  };

  const avatarUrl = portfolio.personInfo?.avatarUrl;
  const avatarUpdatedAt = portfolio.personInfo?.updatedAt;
  const avatarSrc = avatarUrl && avatarUpdatedAt
    ? `${avatarUrl}?t=${new Date(avatarUpdatedAt).getTime()}`
    : avatarUrl || null;

  return (
    <div className="border border-border bg-panel rounded-lg p-4">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="h-12 w-12 rounded-full overflow-hidden border border-border bg-panel2 flex items-center justify-center flex-shrink-0">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt={`${portfolio.personInfo?.name || portfolio.user.email} avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Eye className="h-6 w-6 text-muted" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                {portfolio.personInfo?.name || portfolio.user.email}
              </h3>
              <p className="text-sm text-muted">
                {portfolio.personInfo?.role || "No role specified"}
              </p>
              <p className="text-xs text-muted-disabled mt-1">
                {portfolio.user.email}
                {portfolio.slug && ` • /portfolio/${portfolio.slug}`}
              </p>
            </div>

            {/* Actions */}
            {!showRejectForm ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            ) : (
              <div className="flex-1 max-w-md">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  disabled={isPending}
                  className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg text-sm min-h-[80px] disabled:opacity-50"
                  autoFocus
                />
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isPending || !rejectionReason.trim()}
                    className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Rejecting..." : "Confirm Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason("");
                      setError(null);
                    }}
                    disabled={isPending}
                    className="px-3 py-1.5 border border-border bg-panel text-foreground rounded text-sm font-medium hover:bg-panel2 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
