// Auth route group: minimal sync layout, no dynamic APIs (avoids refetch loops).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
