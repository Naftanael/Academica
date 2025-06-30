
'use client';

import type { TvDisplayInfo } from '@/types';
import dynamic from 'next/dynamic';
import TvCard from '@/components/tv-display/TvCard';
import NoClassesMessage from '@/components/tv-display/NoClassesMessage';

// The ClientRefresher is a small component that forces a server data refresh
// every 5 minutes, ensuring the display stays up-to-date without a full reload.
const ClientRefresher = dynamic(() => import('@/components/tv-display/ClientRefresher'), { ssr: false });

// This component is now a simple "dumb" component. It receives data via props
// and renders it. All data fetching and refreshing is handled by the parent
// Server Component and the ClientRefresher.
export default function TvDisplayClient({ data }: { data: TvDisplayInfo[] }) {
  return (
    <div className="dashboard">
      <ClientRefresher />
      <header>
        <h1>Guia de Salas</h1>
      </header>
      <main className="cards-container">
        {data.length > 0 ? (
          data.map(item => (
            <TvCard key={item.id} item={item} />
          ))
        ) : (
          <NoClassesMessage />
        )}
      </main>
    </div>
  );
}
