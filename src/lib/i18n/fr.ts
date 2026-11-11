// Dictionnaire français (locale par défaut). L'ajout de l'anglais consistera à
// créer `en.ts` avec les mêmes clés et à brancher un sélecteur de langue.
export const fr = {
  marque: "FactuCheck",
  promesse: "Testez vos factures électroniques avant envoi.",
  sousPromesse: "Zéro rejet, zéro retard de paiement.",

  nav: {
    produit: "Produit",
    tarifs: "Tarifs",
    tableauDeBord: "Tableau de bord",
    tester: "Tester une facture",
    clients: "Clients",
    historique: "Historique",
    parametres: "Paramètres",
    connexion: "Connexion",
    inscription: "Créer un compte",
    deconnexion: "Déconnexion",
    essayer: "Tester gratuitement",
  },

  statut: {
    reussi: "Réussi",
    avertissement: "Avertissement",
    bloquant: "Bloquant",
    non_applicable: "Non applicable",
    conforme: "Conforme",
    partiel: "Contrôle partiel",
    nonConforme: "Non conforme",
  },

  commun: {
    chargement: "Analyse en cours…",
    commentCorriger: "Comment corriger",
    source: "Source",
    aVerifier: "À VÉRIFIER",
    exporterPdf: "Exporter le rapport (PDF)",
    testerExemple: "Essayer avec une facture d'exemple",
    deposer: "Déposez vos factures ici",
    deposerAide: "PDF Factur-X, XML UBL ou CII — à l'unité ou par lot",
    parcourir: "Parcourir",
    score: "Score de conformité",
    sur100: "/ 100",
    recommencer: "Tester une autre facture",
    retour: "Retour",
  },

  landing: {
    ctaPrincipal: "Tester une facture gratuitement",
    ctaSecondaire: "Voir les tarifs",
    sansCompte: "Aucune carte bancaire. Premier test sans créer de compte.",
    demoTitre: "Un contrôle complet en 3 étapes",
    etapes: [
      {
        titre: "1. Déposez",
        texte: "Glissez votre facture (PDF Factur-X, UBL ou CII), à l'unité ou par lot.",
      },
      {
        titre: "2. Analysez",
        texte: "Chaque règle est testée en moins de 10 secondes, avec une barre de progression.",
      },
      {
        titre: "3. Corrigez",
        texte: "Un score sur 100, les erreurs en langage simple et comment les corriger.",
      },
    ],
    avantagesTitre: "Pourquoi FactuCheck",
    avantages: [
      {
        titre: "Zéro rejet",
        texte: "Détectez les erreurs bloquantes avant la transmission à la plateforme.",
      },
      {
        titre: "Langage clair",
        texte: "Pas de jargon : chaque erreur est expliquée et accompagnée de la correction.",
      },
      {
        titre: "Pensé pour les cabinets",
        texte: "Gérez plusieurs dossiers clients, avec des rôles et un historique complet.",
      },
    ],
    faqTitre: "Questions fréquentes",
    tarifsTitre: "Des tarifs simples",
    tarifsSousTitre: "Commencez gratuitement, changez d'offre quand vous voulez.",
  },

  legal: {
    avertissementRegles:
      "Chaque règle référence sa source (EN 16931, Factur-X / FNFE-MPE, DGFiP, CGI), mais reste « À VÉRIFIER » : la validation finale s'appuiera sur les schematrons officiels et un expert-comptable. Les résultats sont indicatifs et ne constituent pas un avis réglementaire.",
    partiel:
      "Contrôle partiel : pour cette facture, la validation PDF/A-3 (veraPDF) et/ou la validation XSD complète n'ont pas été exécutées. Les contrôles de structure et de contenu sont passés, mais une facture peut encore être rejetée pour un motif PDF/A-3 ou XSD. Avec ces validateurs activés, le contrôle devient complet.",
  },
} as const;

export type Dictionnaire = typeof fr;
