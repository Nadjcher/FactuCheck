import { AlertCircle, PenLine, ShieldCheck, FileCheck2 } from "lucide-react";
import type { Categorie, Report } from "@/lib/engine/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatutBadge } from "@/components/statut-badge";
import { ScoreRing } from "@/components/score-ring";
import { Infobulle } from "@/components/infobulle";
import { dict } from "@/lib/i18n";
import { formaterDateHeure } from "@/lib/format";

const CAT_LABELS: Record<Categorie, string> = {
  format: "Format et profil",
  pdf: "Conteneur PDF (Factur-X)",
  mentions: "Mentions obligatoires",
  montants: "Montants",
  dates: "Dates",
  numerotation: "Numérotation",
};

const ORDRE: Categorie[] = ["format", "pdf", "mentions", "montants", "dates", "numerotation"];

function SectionTitre({ children, compte }: { children: React.ReactNode; compte?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4 border-b border-border pb-2">
      <h3 className="text-base font-semibold text-foreground">{children}</h3>
      {compte && <span className="text-sm text-muted-foreground tabular">{compte}</span>}
    </div>
  );
}

export function RapportVue({ nom, report }: { nom: string; report: Report }) {
  const verdict = !report.conforme ? "nonConforme" : report.exhaustif ? "conforme" : "partiel";
  const verdictLabel =
    verdict === "conforme"
      ? dict.statut.conforme
      : verdict === "partiel"
        ? dict.statut.partiel
        : dict.statut.nonConforme;
  const verdictColor =
    verdict === "conforme" ? "text-success" : verdict === "partiel" ? "text-warning" : "text-danger";

  // Synthèse d'action : ce qu'il faut corriger, en clair, rassemblé en haut.
  const schFindings = report.schematron?.execute ? report.schematron.findings : [];
  const aCorriger = [
    ...report.findings.filter((f) => f.statut === "bloquant"),
    ...schFindings.filter((f) => f.statut === "bloquant"),
  ];
  const aVerifierPoints = [
    ...report.findings.filter((f) => f.statut === "avertissement"),
    ...schFindings.filter((f) => f.statut === "avertissement"),
  ];

  return (
    <div className="space-y-8">
      {/* Verdict */}
      <Card className="overflow-hidden print-break-avoid">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing score={report.score} conforme={report.conforme} exhaustif={report.exhaustif} size={168} />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate" title={nom}>{nom}</span>
            </div>
            <p className={`font-display text-3xl font-semibold sm:text-4xl ${verdictColor}`}>
              {verdictLabel}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{report.format}</Badge>
              {report.profilFacturx && <Badge tone="primary">{report.profilFacturx}</Badge>}
            </div>
            <dl className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-success tabular font-semibold">{report.counts.reussi}</span>
                <dt className="text-muted-foreground">réussis</dt>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-warning tabular font-semibold">{report.counts.avertissement}</span>
                <dt className="text-muted-foreground">avertissements</dt>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-danger tabular font-semibold">{report.counts.bloquant}</span>
                <dt className="text-muted-foreground">bloquants</dt>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              Analyse du {formaterDateHeure(report.genereLe)}
            </p>
          </div>
        </CardContent>
      </Card>

      {report.erreurParsing && (
        <div className="flex items-start gap-3 rounded-lg border border-danger/40 bg-danger-soft p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          <div>
            <p className="font-medium text-danger">Fichier non exploitable</p>
            <p className="text-muted-foreground">{report.erreurParsing}</p>
          </div>
        </div>
      )}

      {/* Synthèse d'action : l'essentiel, en français simple, avant le détail technique. */}
      {!report.erreurParsing && (
        <section className="print-break-avoid">
          {aCorriger.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success-soft p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              <div className="text-sm">
                <p className="font-semibold text-success">Rien ne bloque l'envoi de cette facture.</p>
                <p className="mt-0.5 text-foreground/80">
                  {aVerifierPoints.length > 0
                    ? `${aVerifierPoints.length} point(s) d'attention ci-dessous, mais aucun n'empêche la transmission.`
                    : "Tous les contrôles bloquants sont au vert."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <SectionTitre compte={`${aCorriger.length} à corriger`}>À corriger avant d'envoyer</SectionTitre>
              <div className="space-y-2">
                {aCorriger.map((f, i) => (
                  <Card key={`fix-${f.ruleId}-${i}`} className="border-danger/30 print-break-avoid">
                    <CardContent className="flex items-start gap-3 p-4">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium">{f.libelle}</p>
                        <p className="mt-0.5 text-muted-foreground">{f.message}</p>
                        {f.commentCorriger && (
                          <p className="mt-2 flex items-start gap-1.5 text-foreground/90">
                            <PenLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                            <span>{f.commentCorriger}</span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {verdict === "partiel" && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="max-w-prose text-foreground/80">{dict.legal.partiel}</p>
        </div>
      )}

      {report.contientReglesAVerifier && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="max-w-prose text-foreground/80">
            <span className="font-medium text-warning">Résultats indicatifs. </span>
            {dict.legal.avertissementRegles}
          </p>
        </div>
      )}

      {/* Séparation claire : l'essentiel est au-dessus, le détail complet en dessous. */}
      {!report.erreurParsing && (
        <div className="flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Détail complet des contrôles
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* Contrôles officiels (Schematron) */}
      {report.schematron && (
        <section className="print-break-avoid">
          <SectionTitre>Contrôles réglementaires officiels (EN 16931 / FNFE)</SectionTitre>
          {!report.schematron.execute ? (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Non exécutés : {report.schematron.note}
            </p>
          ) : report.schematron.findings.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-success">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Aucune anomalie. Source&nbsp;: {report.schematron.source}.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Source&nbsp;: {report.schematron.source}</p>
              {report.schematron.findings.map((f, i) => (
                <Card key={`${f.ruleId}-${i}`} className="print-break-avoid">
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-muted-foreground">{f.ruleId}</p>
                      <p className="mt-1 text-sm">{f.message}</p>
                    </div>
                    <StatutBadge statut={f.statut} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Validation PDF/A-3 (service veraPDF, ISO 19005-3) */}
      {report.pdfA3 && (
        <section className="print-break-avoid">
          <SectionTitre>Validation PDF/A-3 (veraPDF)</SectionTitre>
          {!report.pdfA3.execute ? (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Validation PDF/A-3 complète non exécutée ({report.pdfA3.note}). Le conteneur n'est
              contrôlé que sur ses marqueurs&nbsp;: résultat « Contrôle partiel ».
            </p>
          ) : report.pdfA3.conforme ? (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-success">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              PDF/A-{report.pdfA3.flavour} conforme (ISO 19005-3)&nbsp;: {report.pdfA3.passed} contrôles, 0 échec.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-danger">
                PDF/A-{report.pdfA3.flavour} non conforme&nbsp;: {report.pdfA3.failed} contrôle(s) en échec (veraPDF).
              </p>
              {report.pdfA3.details.map((d, i) => (
                <Card key={`pdfa-${i}`} className="print-break-avoid">
                  <CardContent className="p-4">
                    <p className="font-mono text-xs text-muted-foreground">ISO 19005-3 §{d.clause}</p>
                    <p className="mt-1 text-sm">{d.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Validation XSD (structure, schémas officiels CII/UBL) */}
      {report.xsd && (
        <section className="print-break-avoid">
          <SectionTitre>Validation structurelle (XSD)</SectionTitre>
          {!report.xsd.execute ? (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Validation XSD complète non exécutée ({report.xsd.note}). La structure n'est
              contrôlée qu'en best-effort&nbsp;: résultat « Contrôle partiel ».
            </p>
          ) : report.xsd.valide ? (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-success">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              Structure conforme au schéma XSD officiel ({report.xsd.format}).
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-danger">
                Structure non conforme au schéma XSD officiel ({report.xsd.format})&nbsp;:
                {" "}
                {report.xsd.erreurs.length} erreur(s).
              </p>
              {report.xsd.erreurs.map((e, i) => (
                <Card key={`xsd-${i}`} className="print-break-avoid">
                  <CardContent className="p-4">
                    <p className="font-mono text-xs text-muted-foreground">ligne {e.ligne}</p>
                    <p className="mt-1 text-sm">{e.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Contrôles par catégorie */}
      {ORDRE.map((cat) => {
        const items = report.findings.filter((f) => f.categorie === cat);
        if (items.length === 0) return null;
        const ok = items.filter((f) => f.statut === "reussi").length;
        return (
          <section key={cat} className="print-break-avoid">
            <SectionTitre compte={`${ok}/${items.length}`}>{CAT_LABELS[cat]}</SectionTitre>
            <div className="space-y-2">
              {items.map((f) => (
                <Card key={f.ruleId} className="print-break-avoid">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{f.libelle}</span>
                        <Infobulle texte={f.infobulle} />
                        {f.aVerifier && <Badge tone="warning">{dict.commun.aVerifier}</Badge>}
                      </div>
                      <StatutBadge statut={f.statut} />
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">{f.message}</p>
                    {f.commentCorriger && (
                      <div className="mt-3 flex items-start gap-2.5 rounded-md bg-muted/60 p-3 text-sm">
                        <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <p>
                          <span className="font-medium">{dict.commun.commentCorriger} — </span>
                          {f.commentCorriger}
                        </p>
                      </div>
                    )}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]">
                        {f.ruleId}
                      </span>
                      {f.specId && (
                        <span
                          className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[11px]"
                          title="Identifiant dans la spécification"
                        >
                          {f.specId}
                        </span>
                      )}
                      <span>
                        {dict.commun.source}&nbsp;:{" "}
                        {f.source ?? <span className="italic">non renseignée</span>}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
