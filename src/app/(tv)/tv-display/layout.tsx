
import type { Metadata } from 'next';
import '../../globals.css'; // Adjusted path for globals.css

export const metadata: Metadata = {
  title: 'Painel de Turmas - Academica',
  description: 'Visualização de turmas e suas salas em tempo real.',
};

export default function TvDisplayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Apply specific styling for the TV display content area.
  // Uses theme variables for background and foreground.
  return (
    <div className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col">
      {children}
    </div>
  );
}
