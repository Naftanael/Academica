
import type { Metadata } from 'next';
import '../globals.css'; // Path relative to src/app/(tv)/
// Toaster removed from here, it's now handled by RootLayout

export const metadata: Metadata = {
  title: 'Painel TV - Academica', // General title for the TV section
  description: 'Visualização otimizada para telas de TV.',
};

export default function TvGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is rendered *inside* the RootLayout's <body>.
  // If RootLayout conditionally omits AppShell for TV routes,
  // then this children will be rendered directly in body.
  // If RootLayout always includes AppShell, this children is inside AppShell.
  // The current approach (RootLayout becoming client component) will ensure
  // AppShell is omitted for TV routes.
  return (
    <>
      {children}
      {/* Toaster removed from here, as RootLayout provides it globally */}
    </>
  );
}
