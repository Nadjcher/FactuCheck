import { NextResponse } from "next/server";
import { analyserFichierComplet } from "@/lib/engine";

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

  const resultats = [];
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
      const { report } = await analyserFichierComplet({ nom: f.name, bytes });
      resultats.push({ nom: f.name, report });
    } catch (e) {
      resultats.push({
        nom: f.name,
        erreur: `Échec de l'analyse : ${(e as Error).message}`,
      });
    }
  }

  return NextResponse.json({ resultats });
}
