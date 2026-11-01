import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SmartStock AI — Gestion de stock intelligente pour PME',
  description: 'Solution SaaS prédictive de gestion de stock, prévisions des ruptures par IA et réapprovisionnement optimisé pour PME africaines.',
  keywords: ['gestion de stock', 'intelligence artificielle', 'PME africaines', 'prévision des ruptures', 'EOQ', 'Sénégal', 'FCFA'],
  openGraph: {
    title: 'SmartStock AI — Gestion de stock intelligente',
    description: 'Pilotez votre inventaire, prévenez les ruptures et maximisez votre rentabilité avec notre moteur IA.',
    url: 'https://smartstock-ai.com',
    siteName: 'SmartStock AI',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <body className="font-sans antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
