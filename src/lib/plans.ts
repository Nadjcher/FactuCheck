// Offres d'abonnement. Les prix sont indicatifs (à valider commercialement).
export interface Plan {
  id: "gratuit" | "pro" | "cabinet";
  nom: string;
  prix: number; // € / mois HT
  quota: string;
  cible: string;
  populaire?: boolean;
  avantages: string[];
  cta: string;
  envPriceId?: string; // variable d'env pour l'ID de prix Stripe
}

export const PLANS: Plan[] = [
  {
    id: "gratuit",
    nom: "Gratuit",
    prix: 0,
    quota: "10 factures / mois",
    cible: "Pour découvrir et tester ponctuellement.",
    avantages: [
      "Tous les contrôles de conformité",
      "Rapport détaillé en langage clair",
      "1 utilisateur",
    ],
    cta: "Commencer gratuitement",
  },
  {
    id: "pro",
    nom: "Pro",
    prix: 29,
    quota: "500 factures / mois",
    cible: "TPE/PME et indépendants.",
    populaire: true,
    avantages: [
      "Tout le plan Gratuit",
      "Export PDF des rapports",
      "Historique et recherche",
      "Accès API (clé par compte)",
    ],
    cta: "Passer au Pro",
    envPriceId: "STRIPE_PRICE_PRO",
  },
  {
    id: "cabinet",
    nom: "Cabinet",
    prix: 89,
    quota: "Volume élevé",
    cible: "Cabinets d'expertise comptable multi-clients.",
    avantages: [
      "Tout le plan Pro",
      "Dossiers clients illimités",
      "Rôles (admin, collaborateur, lecture seule)",
      "Tableau de bord par client",
      "Support prioritaire",
    ],
    cta: "Choisir Cabinet",
    envPriceId: "STRIPE_PRICE_CABINET",
  },
];
