
'use client';

import { useState } from 'react';
import type { TvDisplayInfo } from '@/types';
import dynamic from 'next/dynamic';
import TvCard from '@/components/tv-display/TvCard';
import NoClassesMessage from '@/components/tv-display/NoClassesMessage';

const ClientRefresher = dynamic(() => import('@/components/tv-display/ClientRefresher'), { ssr: false });

export default function TvDisplayClient({ initialData }: { initialData: TvDisplayInfo[] }) {
  const [displayData, setDisplayData] = useState<TvDisplayInfo[]>(initialData);

  return (
    <div className="dashboard">
      <ClientRefresher />
      <header>
        <h1>Guia de Salas</h1>
      </header>
      <main className="cards-container">
        {displayData.length > 0 ? (
          displayData.map(item => (
            <TvCard key={item.id} item={item} />
          ))
        ) : (
          <NoClassesMessage />
        )}
      </main>
    </div>
  );
}
