import type { Metadata } from "next";
import "./globals.css";
import { dict } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: `${dict.marque} — ${dict.promesse}`,
    template: `%s · ${dict.marque}`,
  },
  description: `${dict.promesse} ${dict.sousPromesse}`,
};

// Évite le flash de thème : applique le thème avant le premier rendu.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('factucheck-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
