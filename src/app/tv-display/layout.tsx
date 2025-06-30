
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import '../globals.css';
import './tv-display.css'; // Import the new CSS file

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Painel de Salas - Academica',
};

export default function TvDisplayLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body className="tv-display-body">
        {children}
      </body>
    </html>
  );
}
