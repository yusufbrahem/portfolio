import { cn } from "@/lib/utils";
import { Motion } from "@/components/motion";

export function Section({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("py-14 sm:py-20", className)}>
      <Motion>
        <div className="space-y-3">
          {eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.2em] text-muted uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-base leading-7 text-muted sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
      </Motion>
      {children ? <div className="mt-10">{children}</div> : null}
    </section>
  );
}

