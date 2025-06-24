'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppShell from '@/components/layout/AppShell';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();

  const isTvRoute = pathname.startsWith('/tv-display');

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        {isTvRoute ? (
          <>
            {children}
          </>
        ) : (
          <AppShell>{children}</AppShell>
        )}
        <Toaster />
      </body>
    </html>
  );
}
