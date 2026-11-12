/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le moteur de regles s'execute cote serveur ; fast-xml-parser est compatible.
  experimental: {
    serverComponentsExternalPackages: ["fast-xml-parser", "node-schematron"],
  },

  // En-têtes de sécurité statiques (la CSP dynamique à nonce est posée par le
  // middleware). Appliqués à toutes les routes, y compris l'API.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
