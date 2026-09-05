import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Near By — Your time. Your terms. Your Near By.',
  description:
    'A premium marketplace built around choice, privacy, and trusted connections for verified independent service providers and consenting adults.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${body.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
