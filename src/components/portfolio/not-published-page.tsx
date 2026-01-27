import { Container } from "@/components/container";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { FileX, Clock, XCircle, CheckCircle, ArrowRight } from "lucide-react";

type PortfolioStatus = "DRAFT" | "READY_FOR_REVIEW" | "REJECTED" | "PUBLISHED";

type NotPublishedPageProps = {
  portfolio: {
    id: string;
    slug: string | null;
    status: PortfolioStatus | null;
    rejectionReason: string | null;
    userId: string;
  };
};

export async function NotPublishedPage({ portfolio }: NotPublishedPageProps) {
  const session = await getSession();
  const isOwner = session?.user?.id === portfolio.userId;

  const statusConfig = {
    DRAFT: {
      icon: FileX,
      title: "This portfolio is not published yet",
      message: "The owner is still working on their portfolio.",
      ownerMessage: "Your portfolio is in draft mode. Continue building your portfolio and request publication when ready.",
      ownerAction: "Go to Dashboard",
      ownerActionHref: "/admin",
      color: "text-muted",
    },
    READY_FOR_REVIEW: {
      icon: Clock,
      title: "This portfolio is pending review",
      message: "The owner has submitted this portfolio for publication. It's currently under review.",
      ownerMessage: "Your portfolio has been submitted for review. We'll notify you once it's been reviewed.",
      ownerAction: "View Dashboard",
      ownerActionHref: "/admin",
      color: "text-yellow-500",
    },
    REJECTED: {
      icon: XCircle,
      title: "This portfolio was not approved",
      message: "This portfolio is not available at this time.",
      ownerMessage: portfolio.rejectionReason 
        ? `Your portfolio was rejected: ${portfolio.rejectionReason}`
        : "Your portfolio was rejected. Please review the feedback and make necessary changes.",
      ownerAction: "Edit Portfolio",
      ownerActionHref: "/admin",
      color: "text-red-500",
    },
    PUBLISHED: {
      icon: CheckCircle,
      title: "This portfolio is published",
      message: "This portfolio should be visible.",
      ownerMessage: "Your portfolio is published and visible to the public.",
      ownerAction: "Go to Dashboard",
      ownerActionHref: "/admin",
      color: "text-green-500",
    },
  };

  const status = portfolio.status || "DRAFT";
  const config = statusConfig[status];
  const Icon = config.icon;

  const ownerActionHref =
    status === "PUBLISHED" && portfolio.slug
      ? `/portfolio/${portfolio.slug}`
      : config.ownerActionHref;
  const ownerAction =
    status === "PUBLISHED" && portfolio.slug
      ? "View Portfolio"
      : config.ownerAction;

  return (
    <Container className="py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className={`rounded-full bg-panel p-4 ${config.color}`}>
              <Icon className="h-12 w-12" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {config.title}
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-muted">
            {isOwner ? config.ownerMessage : config.message}
          </p>

          {isOwner && (
            <div className="mt-10">
              <Link
                href={ownerActionHref}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-semibold text-foreground hover:bg-blue-500 transition-colors"
              >
                {ownerAction}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {!isOwner && (
            <div className="mt-10">
              <Link
                href="/"
                className="text-base font-semibold text-muted hover:text-foreground transition-colors"
              >
                Return to home
              </Link>
            </div>
          )}
        </div>
      </Container>
  );
}
