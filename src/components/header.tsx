"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, FileDown, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/container";
import { site } from "@/content/site";

const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/experience", label: "Experience" },
  { href: "/skills", label: "Skills" },
  { href: "/projects", label: "Projects" },
  { href: "/architecture", label: "Architecture" },
  { href: "/contact", label: "Contact" },
  { href: "/resume", label: "Resume" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight text-foreground hover:text-accent transition-colors">
            {site.person.name}
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

          <div className="flex items-center gap-2">
            <a
              className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-panel2"
              href={`mailto:${site.person.email}`}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Email</span>
            </a>
            <a
              className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-panel2"
              href={site.person.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Linkedin className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
            <Link
              className="hidden items-center gap-2 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-blue-500 lg:inline-flex"
              href="/resume"
            >
              <FileDown className="h-4 w-4" aria-hidden="true" />
              Resume
            </Link>
          </div>
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

