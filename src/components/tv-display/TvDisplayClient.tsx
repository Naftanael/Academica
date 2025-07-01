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

/**
 * A custom hook to cycle through announcements.
 * @param {Announcement[]} announcements - The list of announcements to display.
 * @param {number} interval - The time in milliseconds to display each announcement.
 * @returns {Announcement[]} The list of announcements to be displayed at the moment (usually one at a time).
 */
const useAnnouncements = (announcements: Announcement[], interval = 10000) => {
    const [, setCurrentAnnouncementIndex] = useState(0);

    useEffect(() => {
        // The robust check ensures that the code does not fail if the announcements are null or empty.
        if (!announcements || announcements.length <= 1) {
            return;
        }
        
        const announcementInterval = setInterval(() => {
            setCurrentAnnouncementIndex((prevIndex) => (prevIndex + 1) % announcements.length);
        }, interval);

        return () => clearInterval(announcementInterval);
    }, [announcements, interval]);

    const visibleAnnouncements = useMemo(() => {
        if (!announcements || !announcements.length) return [];
        // The "ticker" animation can handle multiple items, so let's provide all of them and let the CSS take care of it.
        return announcements;
    }, [announcements]);

    return visibleAnnouncements;
};


/**
 * Renders the main TV screen, filtering and showing active class groups based on the current time.
 * This component is responsible for client-side interactions, such as updating the time every minute.
 *
 * @param {TvDisplayClientProps} props - The props for the component.
 * @returns {JSX.Element} The rendered TV panel interface.
 */
export default function TvDisplayClient({ allGroups, announcements, lastPublished }: TvDisplayClientProps): JSX.Element {
  // The `currentTime` state is initialized as null on the server and defined on the client.
  // This avoids React hydration errors.
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const visibleAnnouncements = useAnnouncements(announcements);

  // The `useEffect` is only executed on the client.
  // It sets the current time and then sets an interval to update it every minute.
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000); // Updates every minute.
    return () => clearInterval(interval);
  }, []);

  // Filters the active groups based on the current time.
  // `useMemo` ensures that this expensive filtering is only executed when the data or time changes.
  const activeGroups = useMemo(() => {
    // If the current time has not yet been set, it does not display any group.
    if (currentTime === null) {
      return [];
    }
    // The main filtering logic is delegated to a robust utility function.
    return filterActiveGroups(allGroups, currentTime);
  }, [allGroups, currentTime]);

  return (
    <>
      <header>
        <h1>Room Guide</h1>
        <LastUpdated lastPublished={lastPublished} />
      </header>
      <main className="cards-container">
        {activeGroups.length > 0 ? (
          activeGroups.map(group => <TvCard key={group.id} item={group} />)
        ) : (
          <NoClassesMessage />
        )}
      </main>
      <AnnouncementsTicker announcements={visibleAnnouncements} />
    </>
  );
}
