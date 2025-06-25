import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guia de Salas - Academica',
  description: 'Visualização de turmas e suas salas em tempo real.',
};

export default function TvDisplayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The h-screen, w-screen, and overflow-hidden classes ensure a no-scroll layout, critical for TV displays.
  return (
    <div className="font-body antialiased bg-primary/50 text-primary-foreground selection:bg-accent/30 selection:text-accent-foreground h-screen w-screen overflow-hidden">
      {children}
    </div>
  );
}
