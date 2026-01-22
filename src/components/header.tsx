"use client";

import Link from "next/link";
import { Container } from "@/components/container";
import { Logo } from "@/components/logo";

export function Header() {

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <Container className="py-4">
        <div className="flex items-center justify-between gap-6">
          <Logo />

          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Login
          </Link>
        </div>
      </Container>
    </header>
  );
}

