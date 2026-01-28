import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Providers } from "@/components/providers";

/**
 * Public site layout: Header, Footer, Providers.
 * Login is under (auth). Admin is under (admin) with its own layout.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Header />
      <main className="relative">{children}</main>
      <Footer />
    </Providers>
  );
}
