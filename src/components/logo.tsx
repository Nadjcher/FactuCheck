import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { dict } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 font-semibold", className)}
      aria-label={`${dict.marque} — accueil`}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg tracking-tight">{dict.marque}</span>
    </Link>
  );
}
