import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseConfigure,
} from "./config";

/** Client serveur (Server Components / Route Handlers). null en mode démo. */
export function getSupabaseServer() {
  if (!supabaseConfigure) return null;
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Appelé depuis un Server Component : ignoré (géré par le middleware).
        }
      },
    },
  });
}

/** Utilisateur courant (ou null). */
export async function getUtilisateur() {
  const sb = getSupabaseServer();
  if (!sb) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}
