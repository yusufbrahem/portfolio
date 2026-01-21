import Link from "next/link";
import { Container } from "@/components/container";
import { Avatar } from "@/components/avatar";

export function PortfolioHeader({
  slug,
  name,
  avatarSrc = "/profile.png",
}: {
  slug: string;
  name: string;
  avatarSrc?: string;
}) {
  const base = `/portfolio/${slug}`;
  const nav = [
    { href: `${base}#skills`, label: "Skills" },
    { href: `${base}#projects`, label: "Projects" },
    { href: `${base}#experience`, label: "Experience" },
    { href: `${base}#about`, label: "About" },
    { href: `${base}#architecture`, label: "Architecture" },
    { href: `${base}#contact`, label: "Contact" },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-6">
          <Link
            href={base}
            className="flex items-center gap-3 text-sm font-semibold text-foreground hover:text-accent transition-colors"
          >
            <Avatar src={avatarSrc} alt={`${name} avatar`} className="h-8 w-8" />
            <span>{name}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Portfolio">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:bg-panel hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <nav className="mt-3 flex flex-wrap gap-2 lg:hidden" aria-label="Portfolio mobile">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-xs font-semibold border border-border bg-panel text-muted hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}

