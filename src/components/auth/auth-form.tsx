"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { supabaseConfigure } from "@/lib/supabase/config";

export function AuthForm({ mode }: { mode: "connexion" | "inscription" }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [motDePasse, setMotDePasse] = React.useState("");
  const [enCours, setEnCours] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const estInscription = mode === "inscription";

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    setEnCours(true);

    const sb = getSupabaseBrowser();
    if (!sb) {
      // Mode démonstration : pas de backend auth → on entre dans l'app.
      setMessage("Mode démonstration : accès direct à l'espace.");
      setTimeout(() => router.push(estInscription ? "/onboarding" : "/tableau-de-bord"), 600);
      return;
    }

    try {
      if (estInscription) {
        const { error } = await sb.auth.signUp({ email, password: motDePasse });
        if (error) throw error;
        router.push("/onboarding");
      } else {
        const { error } = await sb.auth.signInWithPassword({
          email,
          password: motDePasse,
        });
        if (error) throw error;
        router.push("/tableau-de-bord");
      }
    } catch (err) {
      setErreur((err as Error).message);
      setEnCours(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6">
        <h1 className="mb-1 text-2xl font-bold">
          {estInscription ? "Créer un compte" : "Connexion"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {estInscription
            ? "Commencez gratuitement, sans carte bancaire."
            : "Accédez à votre espace FactuCheck."}
        </p>

        {!supabaseConfigure && (
          <p className="mb-4 rounded-md border border-warning/40 bg-warning-soft p-2.5 text-xs text-warning">
            Mode démonstration : l'authentification n'est pas encore configurée
            (variables Supabase absentes).
          </p>
        )}

        <form onSubmit={soumettre} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@cabinet.fr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mdp">Mot de passe</Label>
            <Input
              id="mdp"
              type="password"
              autoComplete={estInscription ? "new-password" : "current-password"}
              required
              minLength={8}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="8 caractères minimum"
            />
          </div>

          {erreur && <p className="text-sm text-danger">{erreur}</p>}
          {message && <p className="text-sm text-success">{message}</p>}

          <Button type="submit" className="w-full" disabled={enCours}>
            {enCours ? "Veuillez patienter…" : estInscription ? "Créer mon compte" : "Se connecter"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {estInscription ? (
            <>
              Déjà un compte ?{" "}
              <Link href="/connexion" className="font-medium text-primary hover:underline">
                Se connecter
              </Link>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="font-medium text-primary hover:underline">
                Créer un compte
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
