
'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppShell from '@/components/layout/AppShell';
import { usePathname } from 'next/navigation';
import { useState, useEffect, type ReactNode } from 'react'; // Added useState, useEffect

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Metadados devem ser exportados de Server Components (ex: page.tsx ou layouts específicos).

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Render a minimal, consistent structure until the client has mounted
  // This avoids hydration errors caused by pathname-dependent logic.
  if (!hasMounted) {
    return (
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
          {/* Keep critical head elements like meta charset, viewport if needed, or next/font links */}
        </head>
        <body className={`${inter.variable} font-body antialiased`}>
          {/* Optional: You can render a global loading spinner here */}
        </body>
      </html>
    );
  }

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
