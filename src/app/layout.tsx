
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppShell from '@/components/layout/AppShell';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

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
        {/* Manual Google Font links removed as next/font handles Inter */}
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
