import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link 
      href="/" 
      className={`text-base font-semibold tracking-tight text-foreground hover:text-accent transition-colors ${className}`}
    >
      Folio
    </Link>
  );
}
