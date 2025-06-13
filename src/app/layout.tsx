'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppShell from '@/components/layout/AppShell';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Metadata export foi removida daqui porque este é um Client Component.
// Metadados devem ser exportados de Server Components (ex: page.tsx ou layouts específicos).

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isTvRoute = pathname.startsWith('/tv-display');

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        {isTvRoute ? (
          <>
            {children} {/* TV routes get children directly, no AppShell */}
          </>
        ) : (
          <AppShell>{children}</AppShell> /* Other routes get AppShell */
        )}
        <Toaster /> {/* Single Toaster for the whole app */}
      </body>
    </html>
  );
}
