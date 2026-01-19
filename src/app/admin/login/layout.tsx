// Login page layout - bypasses admin layout and auth check
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Just render children without admin UI or auth check
  return <>{children}</>;
}
