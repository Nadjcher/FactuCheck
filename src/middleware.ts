import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigure } from "@/lib/supabase/config";

/** Construit la Content-Security-Policy avec un nonce par requête. */
function construireCSP(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production";
  const directives = [
    `default-src 'self'`,
    // Scripts : uniquement 'self' + ceux portant le nonce (pas d'unsafe-inline).
    // 'strict-dynamic' laisse un script de confiance charger ses dépendances.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Styles : Tailwind/Next injectent du style inline + Google Fonts (CSS).
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob:`,
    // Appels réseau : Supabase (hébergé) et Stripe ; ws: pour le HMR en dev.
    `connect-src 'self' https://*.supabase.co https://api.stripe.com${dev ? " ws:" : ""}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ];
  return directives.join("; ");
}

export async function middleware(request: NextRequest) {
  // Nonce par requête, propagé à la requête (lu par le layout pour le script
  // de thème inline) et posé dans l'en-tête CSP de la réponse.
  const octets = new Uint8Array(16);
  crypto.getRandomValues(octets);
  const nonce = btoa(String.fromCharCode(...octets));
  const csp = construireCSP(nonce);

  const enTetesRequete = new Headers(request.headers);
  enTetesRequete.set("x-nonce", nonce);
  enTetesRequete.set("content-security-policy", csp);

  const finaliser = (res: NextResponse) => {
    res.headers.set("content-security-policy", csp);
    return res;
  };

  // Mode démo (Supabase non configuré) : CSP seule.
  if (!supabaseConfigure) {
    return finaliser(NextResponse.next({ request: { headers: enTetesRequete } }));
  }

  let response = NextResponse.next({ request: { headers: enTetesRequete } });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet: { name: string; value: string; options: CookieOptions }[]) {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: enTetesRequete } });
        toSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Rafraîchit la session (cookies) si nécessaire.
  await supabase.auth.getUser();
  return finaliser(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
