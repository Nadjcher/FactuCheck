import Link from "next/link";
import { Logo } from "@/components/logo";
import { dict } from "@/lib/i18n";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            {dict.promesse} {dict.sousPromesse}
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Produit</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/tester" className="hover:text-foreground">{dict.nav.tester}</Link></li>
            <li><Link href="/tarifs" className="hover:text-foreground">{dict.nav.tarifs}</Link></li>
            <li><Link href="/tableau-de-bord" className="hover:text-foreground">{dict.nav.tableauDeBord}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Légal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link></li>
            <li><Link href="/confidentialite" className="hover:text-foreground">Confidentialité / RGPD</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Compte</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/connexion" className="hover:text-foreground">{dict.nav.connexion}</Link></li>
            <li><Link href="/inscription" className="hover:text-foreground">{dict.nav.inscription}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {dict.marque}. Hébergement en Union européenne.
        </div>
      </div>
    </footer>
  );
}
