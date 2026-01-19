import { ArrowRight, ShieldCheck, Landmark, Activity } from "lucide-react";
import { Container } from "@/components/container";
import { Motion } from "@/components/motion";
import { Avatar } from "@/components/avatar";
import { Card, Pill, PrimaryButton, SecondaryButton } from "@/components/ui";
import { getPersonInfo, getHeroContent } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const person = await getPersonInfo();
  const hero = await getHeroContent();

  return (
    <div>
      <Container className="py-14 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-7 lg:col-span-7">
            <div className="flex flex-wrap gap-2">
              <Pill>
                <ShieldCheck
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
                <span className="ml-2">Security-first backend</span>
              </Pill>
              <Pill>
                <Landmark
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
                <span className="ml-2">Banking & fintech</span>
              </Pill>
              <Pill>
                <Activity
                  className="h-4 w-4 text-accent"
                  aria-hidden="true"
                />
                <span className="ml-2">Production reliability</span>
              </Pill>
            </div>

            <Motion delay={0.05}>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {hero.headline}
              </h1>
            </Motion>

            <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg sm:leading-relaxed">
              {hero.subheadline}
            </p>

            <Motion delay={0.15}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryButton href="/contact">
                  Start a conversation <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </PrimaryButton>
                <SecondaryButton href="/resume">Resume</SecondaryButton>
              </div>
            </Motion>

            <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted">
              {hero.highlights.map((h: string) => (
                <li key={h} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="grid gap-5">
              <Motion delay={0.08}>
                <Avatar
                  src="/profile.png"
                  alt={`${person.name} headshot`}
                  priority
                  className="mx-auto aspect-square w-[260px] sm:w-[300px] lg:w-full"
                />
              </Motion>
              <Motion delay={0.12}>
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                        Profile
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {person.name}
                      </p>
                      <p className="text-sm text-muted">{person.role}</p>
                    </div>

                    <div className="grid gap-3">
                      <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                          Current
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">
                          Banking Consultant at Proxym Qatar (Client: QIIB)
                        </p>
                      </div>
                      <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                          Focus
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">
                          Secure APIs • Identity (OAuth2/OIDC, Keycloak) • Transaction systems
                        </p>
                      </div>
                      <div className="rounded-[var(--radius)] border border-border bg-panel2 p-4">
                        <p className="text-xs font-semibold tracking-[0.2em] text-muted-disabled uppercase">
                          Location
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground">{person.location}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Motion>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
