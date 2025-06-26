import type { ReactNode } from 'react';
import '../globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// This layout provides a clean slate for the TV display,
// overriding the main AppShell.
export default function TvDisplayLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <title>Painel de Salas</title>
      </head>
      <body className="font-body">
        {children}
      </body>
    </html>
  );
}
