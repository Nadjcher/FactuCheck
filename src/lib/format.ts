// Helpers de formatage français (montants, dates, nombres).

const EURO = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formaterEuro(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return EURO.format(n);
}

export function formaterNombre(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR").format(n);
}

/** Formate une date brute (ISO ou AAAAMMJJ) en JJ/MM/AAAA. */
export function formaterDate(brut: string | null | undefined): string {
  if (!brut) return "—";
  const compact = brut.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[3]}/${compact[2]}/${compact[1]}`;
  const iso = brut.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return brut;
}

export function formaterDateHeure(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}
