
import '../globals.css'; // Import global styles for Tailwind, etc.

export default function TvDisplayLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Painel de Turmas - Academica</title>
        <meta name="description" content="Visualização de turmas e suas salas em tempo real." />
        <meta httpEquiv="refresh" content="300" />
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
