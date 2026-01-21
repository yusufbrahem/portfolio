import { cn } from "@/lib/utils";

export function Container({
  className,
  children,
  id,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div id={id} className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)} {...props}>
      {children}
    </div>
  );
}

