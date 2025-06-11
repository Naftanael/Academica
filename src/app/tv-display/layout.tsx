import type { Metadata } from 'next';
import '../globals.css'; // Import global styles for Tailwind, etc.

export const metadata: Metadata = {
  title: 'Painel de Turmas - Academica',
  description: 'Visualização de turmas e suas salas em tempo real.',
};

export default function TvDisplayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta httpEquiv="refresh" content="300" /> {/* Auto-refresh every 5 minutes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gray-900 text-white">
        {children}
      </body>
    </html>
  );
}
