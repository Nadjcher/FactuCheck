import type { Metadata } from "next";
import { TarifsGrid } from "@/components/tarifs-grid";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Tarifs" };

export default function TarifsPage() {
  return (
    <div className="container py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{dict.landing.tarifsTitre}</h1>
        <p className="mt-3 text-muted-foreground">{dict.landing.tarifsSousTitre}</p>
      </div>
      <TarifsGrid />
      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
        Les prix sont indiqués hors taxes et à titre indicatif ; ils seront
        confirmés commercialement. Vous pouvez changer d'offre ou résilier à tout
        moment.
      </p>
    </div>
  );
}
