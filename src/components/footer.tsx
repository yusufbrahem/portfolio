import { Container } from "@/components/container";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Portfolio
            </p>
            <p className="text-sm text-muted">
              Multi-portfolio public pages live under <span className="font-mono">/portfolio/:slug</span>
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:items-end">
            <p className="text-xs text-muted-disabled">
              © {new Date().getFullYear()} Built with Next.js.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

