import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";

/**
 * Admin layout: Providers only. No site Header/Footer so the admin
 * layout’s header and sidebar have full control.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Header />
      <main className="relative">{children}</main>
      <Footer />
    </Providers>
  );
}
