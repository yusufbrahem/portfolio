"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Container } from "@/components/container";

const nav = [
  { href: "/", label: "Home" },
  { href: "/admin/login", label: "Admin" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-foreground hover:text-accent transition-colors">
            Portfolio
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-panel2 text-foreground"
                      : "text-muted hover:bg-panel hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="text-sm text-muted">Multi-portfolio</div>
        </div>

        {/* Mobile nav */}
        <nav
          className="mt-3 flex flex-wrap gap-2 lg:hidden"
          aria-label="Primary mobile"
        >
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                  active
                    ? "bg-panel2 text-foreground"
                    : "border border-border bg-panel text-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </Container>
    </header>
  );
}

