
'use client';

import { useState, useEffect } from 'react';
import type { TvDisplayInfo } from '@/types';
import dynamic from 'next/dynamic';
import TvCard from '@/components/tv-display/TvCard';
import NoClassesMessage from '@/components/tv-display/NoClassesMessage';

const ClientRefresher = dynamic(() => import('@/components/tv-display/ClientRefresher'), { ssr: false });

async function fetchTvDisplayData(): Promise<TvDisplayInfo[]> {
  try {
    const response = await fetch('/api/tv-data');
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching TV display data:", error);
    return [];
  }
}

export default function TvDisplayClient({ initialData }: { initialData: TvDisplayInfo[] }) {
  const [displayData, setDisplayData] = useState<TvDisplayInfo[]>(initialData);

  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetchTvDisplayData();
      setDisplayData(data);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

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
