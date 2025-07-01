
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import '../globals.css';
import './tv-display.css';

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
    <div className={`${poppins.variable} dashboard`}>
        {children}
    </div>
  );
}
