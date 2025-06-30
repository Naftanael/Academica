
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Poppins } from 'next/font/google';
import '../globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Painel de Salas - Crystal Elegance',
  other: {
    "stylesheet": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  }
};

export default function TvDisplayLayout({ children }: { children: ReactNode }) {
  return (
    <div 
      className={poppins.variable}
      style={{
        fontFamily: 'var(--font-family)',
        background: 'radial-gradient(circle, var(--bg-gradient-start), var(--bg-gradient-end))',
        color: 'var(--text-primary-color)',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
      }}
    >
      {children}
    </div>
  );
}
