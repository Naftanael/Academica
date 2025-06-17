
import type { Metadata } from 'next';
// import '../globals.css'; // Removed: globals.css is imported in the root layout

export const metadata: Metadata = {
  title: 'Painel TV - Academica', // General title for the TV section
  description: 'Visualização otimizada para telas de TV.',
};

export default function TvGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
