import { NextResponse } from "next/server";
import { analyserFichierComplet, marquerUniciteLot } from "@/lib/engine";
import type { Report } from "@/lib/engine";

export const runtime = "nodejs";

const TAILLE_MAX = 15 * 1024 * 1024; // 15 Mo par fichier

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { erreur: "Requête invalide (multipart/form-data attendu)." },
      { status: 400 },
    );
  }

  const fichiers = form.getAll("fichiers").filter((f): f is File => f instanceof File);
  if (fichiers.length === 0) {
    return NextResponse.json({ erreur: "Aucun fichier fourni." }, { status: 400 });
  }
  if (fichiers.length > 50) {
    return NextResponse.json(
      { erreur: "Lot trop volumineux (50 fichiers maximum)." },
      { status: 400 },
    );
  }

  const resultats: { nom: string; report?: Report; erreur?: string }[] = [];
  const lot: { numero: string | null; report: Report }[] = [];
  for (const f of fichiers) {
    if (f.size > TAILLE_MAX) {
      resultats.push({
        nom: f.name,
        erreur: "Fichier trop volumineux (15 Mo maximum).",
      });
      continue;
    }
    const bytes = Buffer.from(await f.arrayBuffer());
    try {
      const { parsed, report } = await analyserFichierComplet({ nom: f.name, bytes });
      resultats.push({ nom: f.name, report });
      lot.push({ numero: parsed.numero, report });
    } catch (e) {
      resultats.push({
        nom: f.name,
        erreur: `Échec de l'analyse : ${(e as Error).message}`,
      });
    }
  }

  // FC-M01 : unicité du numéro dans le lot (contrôle transversal).
  marquerUniciteLot(lot);

  return NextResponse.json({ resultats });
}
