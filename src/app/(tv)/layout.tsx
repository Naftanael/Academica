
import type { Metadata } from 'next';
import '../globals.css'; // Path relative to src/app/(tv)/
import { Toaster } from '@/components/ui/toaster';

// The Inter font is loaded by the RootLayout (src/app/layout.tsx)
// and its CSS variable is applied to the <body> tag there.
// So, no need to re-declare or re-apply it here.

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
  // It must not include its own <html>, <head>, or <body> tags.
  // The purpose here is to provide a layout for the (tv) segment
  // that *omits* the AppShell (which contains the sidebar).
  return (
    <>
      {/* AppShell is intentionally omitted here to hide the sidebar for the TV view */}
      {children}
      {/* Toaster is included here to ensure notifications work within this layout segment.
          It's also in the RootLayout, but having it here ensures it's definitely
          available for this specific "branch" of the layout tree. */}
      <Toaster />
    </>
  );
}
