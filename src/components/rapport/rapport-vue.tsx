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
  return (
    <div className="space-y-8">
      {/* Verdict */}
      <Card className="overflow-hidden print-break-avoid">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8">
          <ScoreRing score={report.score} conforme={report.conforme} size={168} />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileCheck2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate" title={nom}>{nom}</span>
            </div>
            <p
              className={`font-display text-3xl font-semibold sm:text-4xl ${
                report.conforme ? "text-success" : "text-danger"
              }`}
            >
              {report.conforme ? dict.statut.conforme : dict.statut.nonConforme}
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

      {report.contientReglesAVerifier && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="max-w-prose text-foreground/80">
            <span className="font-medium text-warning">Résultats indicatifs. </span>
            {dict.legal.avertissementRegles}
          </p>
        </div>
      )}

      {/* Contrôles officiels (Schematron) */}
      {report.schematron && (
        <section className="print-break-avoid">
          <SectionTitre>Contrôles officiels (Schematron)</SectionTitre>
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
