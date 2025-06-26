import type { ReactNode } from 'react';

// This layout was previously emptied, which contributed to build errors.
// It is now restored to be a valid passthrough layout, ensuring the TV display route
// is handled correctly by Next.js without applying the main application shell.
export default function TvDisplayLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
