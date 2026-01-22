import { Container } from "@/components/container";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-6">
        <div className="text-center">
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} Folio
          </p>
        </div>
      </Container>
    </footer>
  );
}

