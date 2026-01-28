import Link from "next/link";
import { Container } from "@/components/container";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  let portfolioSlug: string | null = null;
  let isPublished = false;

  if (session?.user) {
    if (session.user.role === "super_admin") {
      portfolioSlug = null;
    } else if (session.user.portfolioId) {
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: session.user.portfolioId },
        select: { slug: true, isPublished: true },
      });
      portfolioSlug = portfolio?.slug || null;
      isPublished = portfolio?.isPublished || false;
    }
  }

  return (
    <>
      <section className="border-b border-border bg-background">
        <Container className="py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Create and share your professional portfolio
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted">
              Build a beautiful, customizable portfolio to showcase your work, skills, and experience. No coding required.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {!session ? (
                <>
                  <Link
                    href="/admin"
                    className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-foreground hover:bg-blue-500 transition-colors"
                  >
                    Create your portfolio
                  </Link>
                  <Link
                    href="#features"
                    className="text-base font-semibold text-foreground hover:text-accent transition-colors"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </>
              ) : session.user.role === "super_admin" ? (
                <Link
                  href="/admin/users"
                  className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-foreground hover:bg-blue-500 transition-colors"
                >
                  Go to Admin Panel
                </Link>
              ) : (
                <>
                  <Link
                    href="/admin"
                    className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-foreground hover:bg-blue-500 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                  {portfolioSlug && isPublished && (
                    <Link
                      href={`/portfolio/${portfolioSlug}`}
                      className="text-base font-semibold text-foreground hover:text-accent transition-colors"
                    >
                      View My Portfolio <span aria-hidden="true">→</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section id="features" className="border-b border-border bg-panel">
        <Container className="py-24 sm:py-32">
          <div className="mx-auto max-w-2xl lg:max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-center mb-16">
              Everything you need to showcase your work
            </h2>
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <span className="h-5 w-5 rounded bg-accent/20 flex items-center justify-center">
                    <span className="h-2 w-2 rounded bg-accent"></span>
                  </span>
                  Professional portfolio
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted">
                  <p className="flex-auto">
                    Create a polished portfolio that reflects your professional identity and showcases your best work.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <span className="h-5 w-5 rounded bg-accent/20 flex items-center justify-center">
                    <span className="h-2 w-2 rounded bg-accent"></span>
                  </span>
                  Easy content management
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted">
                  <p className="flex-auto">
                    Manage your portfolio content through an intuitive admin panel. Update your work anytime, anywhere.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <span className="h-5 w-5 rounded bg-accent/20 flex items-center justify-center">
                    <span className="h-2 w-2 rounded bg-accent"></span>
                  </span>
                  Share with a public link
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted">
                  <p className="flex-auto">
                    Get a custom URL for your portfolio. Share it with clients, employers, or anyone who wants to see your work.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-background">
        <Container className="py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-8">
              Built for professionals
            </h2>
            <p className="text-lg leading-8 text-muted mb-12">
              Whether you're an engineer, designer, consultant, or creative professional, create a portfolio that presents your work with clarity and professionalism.
            </p>
            <div className="mt-10">
              {!session ? (
                <Link
                  href="/admin"
                  className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-foreground hover:bg-blue-500 transition-colors inline-block"
                >
                  Get started
                </Link>
              ) : session.user.role === "super_admin" ? (
                <Link
                  href="/admin/users"
                  className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-foreground hover:bg-blue-500 transition-colors inline-block"
                >
                  Go to Admin Panel
                </Link>
              ) : (
                <Link
                  href="/admin"
                  className="rounded-lg bg-accent px-6 py-3 text-base font-semibold text-foreground hover:bg-blue-500 transition-colors inline-block"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
