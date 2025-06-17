
import type { Metadata } from 'next';
import '../../globals.css'; // Adjusted path for globals.css

export const metadata: Metadata = {
  title: 'Guia de Salas - Academica',
  description: 'Visualização de turmas e suas salas em tempo real.',
};

export default function TvDisplayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Removed className="dark" to use light theme by default
    <div> 
      <div className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary-foreground">
        {children}
      </div>
    </div>
  );
}

    