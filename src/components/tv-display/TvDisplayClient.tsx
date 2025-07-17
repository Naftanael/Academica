/**
 * @file src/components/tv-display/TvDisplayClient.tsx
 * @description Client component for the TV panel. It handles real-time filtering and display of class groups.
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { filterActiveGroups, ClientTvDisplayInfo } from '@/lib/tv-display-utils';
import TvCard from '@/components/tv-display/TvCard';
import NoClassesMessage from '@/components/tv-display/NoClassesMessage';
import LastUpdated from '@/components/tv-display/LastUpdated';
import AnnouncementsTicker from './AnnouncementsTicker';
import type { Announcement } from '@/types';

interface TvDisplayClientProps {
  allGroups: ClientTvDisplayInfo[];
  announcements: Announcement[];
  lastPublished: string;
}

const useAnnouncements = (announcements: Announcement[], interval = 10000) => {
    const [, setCurrentAnnouncementIndex] = useState(0);

    useEffect(() => {
        if (!announcements || announcements.length <= 1) return;
        
        const announcementInterval = setInterval(() => {
            setCurrentAnnouncementIndex((prevIndex) => (prevIndex + 1) % announcements.length);
        }, interval);

        return () => clearInterval(announcementInterval);
    }, [announcements, interval]);

    return useMemo(() => {
        if (!announcements || !announcements.length) return [];
        return announcements;
    }, [announcements]);
};

export default function TvDisplayClient({ allGroups, announcements, lastPublished }: TvDisplayClientProps): JSX.Element {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const visibleAnnouncements = useAnnouncements(announcements);
  const [isReadyForCapture, setIsReadyForCapture] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeGroups = useMemo(() => {
    if (currentTime === null) {
      return [];
    }
    return filterActiveGroups(allGroups, currentTime);
  }, [allGroups, currentTime]);

  useEffect(() => {
    if (currentTime && !isReadyForCapture) {
      setIsReadyForCapture(true);
    }
  }, [currentTime, isReadyForCapture]);

  useEffect(() => {
    // This effect runs when isReadyForCapture changes to true
    if (isReadyForCapture) {
      // Check if inside an iframe for export
      const params = new URLSearchParams(window.location.search);
      if (window.parent && params.get('export') === 'true') {
        // Post message to parent window indicating it's ready
        window.parent.postMessage('tv-display-ready-for-capture', '*');
      }
    }
  }, [isReadyForCapture]);

  return (
    <>
      <header>
        <h1>Guia de Salas</h1>
        <LastUpdated lastPublished={lastPublished} />
      </header>
      <main className="cards-container">
        {activeGroups.length > 0 ? (
          activeGroups.map(group => <TvCard key={group.id} item={group} />)
        ) : (
          // We show NoClassesMessage only when rendering is complete.
          currentTime && <NoClassesMessage />
        )}
      </main>
      <AnnouncementsTicker announcements={visibleAnnouncements} />
    </>
  );
}
