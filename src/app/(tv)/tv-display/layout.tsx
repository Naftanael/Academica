
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
  // This layout is rendered *inside* the RootLayout's body and AppShell.
  // It cannot define its own <html>, <head>, <body> tags.
  // Head elements like title and description are handled by exporting `metadata`.
  // The Inter font is loaded by the RootLayout.
  // The meta refresh tag is omitted; if needed, it should be handled client-side in the page.

  // Apply specific styling for the TV display content area.
  return (
    <div className="font-body antialiased bg-gray-900 text-white min-h-screen flex flex-col">
      {children}
    </div>
  );
}
