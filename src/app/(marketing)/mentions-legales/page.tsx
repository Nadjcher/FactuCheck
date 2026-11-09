import type { Metadata } from "next";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegalesPage() {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Mentions légales</h1>
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p className="rounded-md border border-warning/40 bg-warning-soft p-3 text-warning">
          Modèle à compléter avec les informations de votre société avant mise en
          production (champs entre crochets).
        </p>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Éditeur</h2>
          <p>
            {dict.marque} — [Forme juridique] au capital de [montant] €. Siège
            social : [adresse]. SIREN : [SIREN]. Directeur de la publication :
            [nom].
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Hébergement</h2>
          <p>
            Les données et l'application sont hébergées au sein de l'Union
            européenne auprès de [hébergeur, région UE].
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Contact</h2>
          <p>Pour toute question : [adresse e-mail de contact].</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Avertissement sur les contrôles
          </h2>
          <p>{dict.legal.avertissementRegles}</p>
        </section>
      </div>
    </div>
  );
}
