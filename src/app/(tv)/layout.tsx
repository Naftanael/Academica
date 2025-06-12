
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css'; // Path relative to src/app/(tv)/
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        {/* AppShell is intentionally omitted here to hide the sidebar */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
