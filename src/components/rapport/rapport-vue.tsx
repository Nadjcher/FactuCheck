import { AlertCircle, Wrench, CheckCircle2, FileCheck2 } from "lucide-react";
import type { Categorie, Report } from "@/lib/engine/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatutBadge } from "@/components/statut-badge";
import { ScoreRing } from "@/components/score-ring";
import { Infobulle } from "@/components/infobulle";
import { dict } from "@/lib/i18n";
import { formaterDateHeure } from "@/lib/format";

const CAT_LABELS: Record<Categorie, string> = {
  format: "Format & profil",
  pdf: "Conteneur PDF (Factur-X)",
  mentions: "Mentions obligatoires",
  montants: "Montants",
  dates: "Dates",
  numerotation: "Numérotation",
};

const ORDRE: Categorie[] = ["format", "pdf", "mentions", "montants", "dates", "numerotation"];

export function RapportVue({ nom, report }: { nom: string; report: Report }) {
  return (
    <div className="space-y-6">
      {/* Résumé */}
      <Card className="print-break-avoid">
        <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
          <ScoreRing score={report.score} conforme={report.conforme} />
          <div className="flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-semibold" title={nom}>
                {nom}
              </h2>
              <Badge tone={report.conforme ? "success" : "danger"}>
                {report.conforme ? dict.statut.conforme : dict.statut.nonConforme}
              </Badge>
              <Badge tone="neutral">{report.format}</Badge>
              {report.profilFacturx && <Badge tone="primary">{report.profilFacturx}</Badge>}
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
              <span className="text-success">● {report.counts.reussi} réussis</span>
              <span className="text-warning">● {report.counts.avertissement} avertissements</span>
              <span className="text-danger">● {report.counts.bloquant} bloquants</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Rapport généré le {formaterDateHeure(report.genereLe)}
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

      {report.contientReglesAVerifier && (
        <div className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-warning">
            <Badge tone="warning">{dict.commun.aVerifier}</Badge>
            Résultats indicatifs
          </p>
          <p className="mt-1 text-muted-foreground">{dict.legal.avertissementRegles}</p>
        </div>
      )}

      {/* Contrôles officiels (Schematron) */}
      {report.schematron && (
        <section className="print-break-avoid">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            Contrôles officiels (Schematron)
          </h3>
          {!report.schematron.execute ? (
            <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Non exécutés : {report.schematron.note}
            </p>
          ) : report.schematron.findings.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success-soft p-3 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Aucune anomalie détectée. Source : {report.schematron.source}.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Source : {report.schematron.source}
              </p>
              {report.schematron.findings.map((f, i) => (
                <Card key={`${f.ruleId}-${i}`} className="print-break-avoid">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-sm font-medium">{f.ruleId}</span>
                      <StatutBadge statut={f.statut} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{f.message}</p>
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
        return (
          <section key={cat} className="print-break-avoid">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {CAT_LABELS[cat]}
            </h3>
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
                    <p className="mt-1 text-sm text-muted-foreground">{f.message}</p>
                    {f.commentCorriger && (
                      <div className="mt-3 flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
                        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        <div>
                          <span className="font-medium">{dict.commun.commentCorriger} : </span>
                          {f.commentCorriger}
                        </div>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {dict.commun.source} :{" "}
                      {f.source ?? (
                        <span className="italic">non renseignée ({dict.commun.aVerifier})</span>
                      )}
                      {" · "}
                      <span className="font-mono">{f.ruleId}</span>
                    </p>
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
