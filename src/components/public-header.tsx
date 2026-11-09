import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { dict } from "@/lib/i18n";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Principale">
          <Link href="/#produit" className="text-muted-foreground hover:text-foreground">
            {dict.nav.produit}
          </Link>
          <Link href="/tarifs" className="text-muted-foreground hover:text-foreground">
            {dict.nav.tarifs}
          </Link>
          <Link href="/tester" className="text-muted-foreground hover:text-foreground">
            {dict.nav.tester}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/connexion"
            className={buttonVariants({ variant: "ghost", size: "sm" }) + " hidden sm:inline-flex"}
          >
            {dict.nav.connexion}
          </Link>
          <Link href="/tester" className={buttonVariants({ size: "sm" })}>
            {dict.nav.essayer}
          </Link>
        </div>
      </div>
    </header>
  );
}
