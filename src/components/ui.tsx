import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-border bg-panel backdrop-blur",
        "shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-panel2 px-3 py-1",
        "text-xs font-medium text-foreground/90",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5",
        "bg-[linear-gradient(135deg,var(--accent2),var(--accent))] text-black",
        "font-semibold tracking-tight shadow-[0_12px_30px_rgba(98,230,255,0.16)]",
        "transition-transform hover:translate-y-[-1px] active:translate-y-0",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SecondaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5",
        "border border-border bg-panel text-foreground",
        "font-semibold tracking-tight backdrop-blur",
        "transition-colors hover:bg-panel2",
        className,
      )}
    >
      {children}
    </Link>
  );
}

