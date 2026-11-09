/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Le moteur de regles s'execute cote serveur ; fast-xml-parser est compatible.
  experimental: {
    serverComponentsExternalPackages: ["fast-xml-parser"],
  },
};

export default nextConfig;
