import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SmartStock AI — Gestion de stock intelligente',
  description: 'Application SaaS de gestion de stock avec IA pour PME africaines',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
