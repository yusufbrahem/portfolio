"use client";

import { useState, useTransition } from "react";
import { Eye, CheckCircle, Clock, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestPortfolioPublication } from "@/app/actions/portfolio";

type PortfolioStatus = "DRAFT" | "READY_FOR_REVIEW" | "REJECTED" | "PUBLISHED";

type PublicationRequestProps = {
  currentStatus: PortfolioStatus | null;
  rejectionReason?: string | null;
  showFullCard?: boolean;
};

export function PublicationRequest({ 
  currentStatus, 
  rejectionReason,
  showFullCard = false 
}: PublicationRequestProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleRequestPublication = () => {
    setError(null);
    startTransition(async () => {
      try {
        await requestPortfolioPublication();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to request publication");
      }
    });
  };

  if (currentStatus === "PUBLISHED") {
    return (
      <div className={`${showFullCard ? "p-6 border border-border bg-panel rounded-lg" : ""}`}>
        <div className="flex items-center gap-3 text-green-500">
          <CheckCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-foreground">Portfolio Published</h3>
            <p className="text-sm text-muted">Your portfolio is live and accessible to the public.</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === "READY_FOR_REVIEW") {
    return (
      <div className={`${showFullCard ? "p-6 border border-border bg-panel rounded-lg" : ""}`}>
        <div className="flex items-center gap-3 text-yellow-500">
          <Clock className="h-5 w-5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Pending Review</h3>
            <p className="text-sm text-muted">Your portfolio has been submitted for review. We&apos;ll notify you once it&apos;s been reviewed.</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentStatus === "REJECTED") {
    return (
      <div className={`${showFullCard ? "p-6 border border-border bg-panel rounded-lg" : ""}`}>
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-red-500">Portfolio Rejected</h3>
            {rejectionReason && (
              <p className="text-sm text-muted mt-1">{rejectionReason}</p>
            )}
            <p className="text-sm text-muted mt-2">Please review the feedback, make necessary changes, and request review again.</p>
            <button
              type="button"
              onClick={handleRequestPublication}
              disabled={isPending}
              className="mt-4 px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Request Review Again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DRAFT status or null
  return (
    <div className={`${showFullCard ? "p-6 border border-border bg-panel rounded-lg" : ""}`}>
      <div className="flex items-start gap-3">
        <Eye className="h-5 w-5 text-muted mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-2">Request Publication</h3>
          <p className="text-sm text-muted mb-4">
            {showFullCard 
              ? "Your portfolio is in draft mode. When you're ready, submit it for review to make it public."
              : "Submit your portfolio for review to make it public."
            }
          </p>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <button
            type="button"
            onClick={handleRequestPublication}
            disabled={isPending}
            className="px-4 py-2 bg-accent text-foreground font-semibold rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isPending ? "Submitting..." : "Request Publication"}
          </button>
        </div>
      </div>
    </div>
  );
}
