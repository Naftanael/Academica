
import type { Metadata } from 'next';
// import '../../globals.css'; // Removed: globals.css is imported in the root layout

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
    <div> 
      <div className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary-foreground">
        {children}
      </div>
    </div>
  );
}

    
