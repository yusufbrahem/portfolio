import { Container } from "@/components/container";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur">
      <Container className="py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {site.person.name}
            </p>
            <p className="text-sm text-muted">
              {site.person.role} • {site.person.location}
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm sm:items-end">
            <a className="text-foreground hover:underline" href={`mailto:${site.person.email}`}>
              {site.person.email}
            </a>
            <a
              className="text-foreground hover:underline"
              href={site.person.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <p className="text-xs text-muted">
              © {new Date().getFullYear()} {site.person.name}. Built with Next.js.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

