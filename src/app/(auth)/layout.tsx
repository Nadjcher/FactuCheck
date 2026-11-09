import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>
      <footer className="container py-6 text-center text-xs text-muted-foreground">
        <Link href="/mentions-legales" className="hover:text-foreground">
          Mentions légales
        </Link>
        {" · "}
        <Link href="/confidentialite" className="hover:text-foreground">
          Confidentialité
        </Link>
      </footer>
    </div>
  );
}
