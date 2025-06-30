'use client';

import { useState, useEffect, useMemo } from 'react';
import type { TvDisplayInfo, ClassGroupStatus } from '@/types';
import { getCurrentShift, isValidDate } from '@/lib/utils';
import { JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';
import { isWithinInterval, parseISO } from 'date-fns';
import TvCard from '@/components/tv-display/TvCard';
import NoClassesMessage from '@/components/tv-display/NoClassesMessage';
import LastUpdated from '@/components/tv-display/LastUpdated';

// The type from page.tsx will match this one once types/index.ts is updated.
interface ClientTvDisplayInfo extends TvDisplayInfo {
    status: ClassGroupStatus;
}

export default function TvDisplayClient({ allGroups, lastPublished }: { allGroups: ClientTvDisplayInfo[], lastPublished: string }) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        // This effect runs only on the client, after the initial render,
        // which safely avoids hydration mismatches.
        setCurrentTime(new Date());

        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    const activeGroups = useMemo(() => {
        // If currentTime is null, it means we're in the initial server render
        // or the client hasn't hydrated yet. Return empty array to match server.
        if (currentTime === null) {
            return [];
        }
        
        // This logic now runs on the client, using the browser's local time.
        const currentShift = getCurrentShift(currentTime.getHours());
        if (!currentShift) return [];

        const currentDayName = JS_DAYS_OF_WEEK_MAP_TO_PT[currentTime.getDay()];

        if (!Array.isArray(allGroups)) {
            return []; // Safeguard against invalid props
        }

        return allGroups.filter(group => {
            const isCurrentShift = group.shift === currentShift;
            const isCurrentDay = Array.isArray(group.classDays) && group.classDays.includes(currentDayName);
            const isInDateRange =
                isValidDate(group.startDate) &&
                isValidDate(group.endDate) &&
                isWithinInterval(currentTime, {
                    start: parseISO(group.startDate),
                    end: parseISO(group.endDate),
                });
            
            const isActive = group.status === 'Em Andamento';

            return isActive && isCurrentShift && isCurrentDay && isInDateRange;
        });

    }, [allGroups, currentTime]);

    return (
        <div className="dashboard">
            <header>
                <h1>Guia de Salas</h1>
                <LastUpdated lastPublished={lastPublished} />
            </header>
            <main className="cards-container">
                {activeGroups.length > 0 ? (
                    activeGroups.map(group => (
                        <TvCard key={group.id} item={group} />
                    ))
                ) : (
                    <NoClassesMessage />
                )}
            </main>
        </div>
    );
}
