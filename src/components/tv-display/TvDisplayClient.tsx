/**
 * @file src/components/tv-display/TvDisplayClient.tsx
 * @description Client component for the TV display. It handles real-time updates and filtering of class groups.
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { filterActiveGroups, ClientTvDisplayInfo } from '@/lib/tv-display-utils';
import TvCard from '@/components/tv-display/TvCard';
import NoClassesMessage from '@/components/tv-display/NoClassesMessage';
import LastUpdated from '@/components/tv-display/LastUpdated';

interface TvDisplayClientProps {
  allGroups: ClientTvDisplayInfo[];
  lastPublished: string;
}

/**
 * Renders the main TV display, filtering and showing active class groups based on the current time.
 * This component is responsible for client-side interactions, such as updating the time every minute.
 *
 * @param {TvDisplayClientProps} props - The props for the component.
 * @returns {JSX.Element} The rendered TV display interface.
 */
export default function TvDisplayClient({ allGroups, lastPublished }: TvDisplayClientProps): JSX.Element {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeGroups = useMemo(() => {
    if (currentTime === null) {
      return [];
    }
    // The core filtering logic is delegated to this robust utility function.
    return filterActiveGroups(allGroups, currentTime);
  }, [allGroups, currentTime]);

  return (
    <div className="dashboard">
      <header>
        <h1>Guia de Salas</h1>
        <LastUpdated lastPublished={lastPublished} />
      </header>
      <main className="cards-container">
        {activeGroups.length > 0 ? (
          activeGroups.map(group => <TvCard key={group.id} item={group} />)
        ) : (
          <NoClassesMessage />
        )}
      </main>
    </div>
  );
}
