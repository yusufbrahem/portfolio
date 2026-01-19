import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { SecondaryButton } from "@/components/ui";

export default function NotFound() {
  return (
    <Container>
      <Section
        eyebrow="404"
        title="This page does not exist"
        description="The route you requested isn’t available. Use the navigation above or return home."
      >
        <div className="flex">
          <SecondaryButton href="/">Go to Home</SecondaryButton>
        </div>
      </Section>
    </Container>
  );
}

