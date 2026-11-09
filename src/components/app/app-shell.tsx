"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  Users,
  History,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { dict } from "@/lib/i18n";

const NAV = [
  { href: "/tableau-de-bord", label: dict.nav.tableauDeBord, Icon: LayoutDashboard },
  { href: "/tester", label: dict.nav.tester, Icon: ScanLine },
  { href: "/clients", label: dict.nav.clients, Icon: Users },
  { href: "/historique", label: dict.nav.historique, Icon: History },
  { href: "/parametres", label: dict.nav.parametres, Icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ouvert, setOuvert] = React.useState(false);

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Navigation de l'espace">
      {NAV.map(({ href, label, Icon }) => {
        const actif = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOuvert(false)}
            aria-current={actif ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              actif
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <div className="mb-6 px-2">
          <Logo />
        </div>
        {nav}
        <div className="mt-auto space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {dict.nav.deconnexion}
          </Link>
        </div>
      </aside>

      {/* Drawer mobile */}
      {ouvert && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOuvert(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-card p-4 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button onClick={() => setOuvert(false)} aria-label="Fermer le menu">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden"
              onClick={() => setOuvert(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="md:hidden">
              <Logo />
            </span>
          </div>
          <ThemeToggle />
        </header>
        <main id="contenu" className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
