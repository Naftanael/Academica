
import type { Metadata } from 'next';
import '../../globals.css'; // Adjusted path for globals.css

export const metadata: Metadata = {
  title: 'Guia de Salas - Academica', // Updated title
  description: 'Visualização de turmas e suas salas em tempo real.',
};

export default function TvDisplayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Apply specific styling for the TV display content area.
  // Uses theme variables for background and foreground.
  // Forcing dark theme for high contrast on TVs
  return (
    <div className="dark"> {/* Force dark theme */}
      <div className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
