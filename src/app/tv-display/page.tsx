
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import { getCurrentShift } from '@/lib/utils';
import TvDisplayClient from './TvDisplayClient';
import { parseISO, isWithinInterval, isValid } from 'date-fns';
import { JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';

export default async function TvDisplayPage() {
    let displayData: TvDisplayInfo[] = [];
    try {
        const [classGroups, classrooms] = await Promise.all([
            readData<ClassGroup>('classgroups.json'),
            readData<Classroom>('classrooms.json'),
        ]);

        const now = new Date();
        
        // Brazil is generally UTC-3. Calculate local time parts from the server's current time.
        const brazilHour = (now.getUTCHours() - 3 + 24) % 24;
        const currentShift = getCurrentShift(brazilHour);
        
        // If there's no active shift (e.g., middle of the night), there are no classes.
        if (!currentShift) {
            return <TvDisplayClient data={[]} />;
        }

        // Determine the current day in Brazil. If it's 00, 01, or 02 UTC, it's the previous day in Brazil.
        const utcDay = now.getUTCDay();
        const utcHour = now.getUTCHours();
        const brazilDayIndex = utcHour < 3 ? (utcDay - 1 + 7) % 7 : utcDay;
        const currentDayNameInBrazil = JS_DAYS_OF_WEEK_MAP_TO_PT[brazilDayIndex];

        const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));

        const activeClassGroups = classGroups.filter(cg => {
            // Basic data integrity checks
            if (cg.status !== 'Em Andamento' || !cg.startDate || !cg.endDate) {
                return false;
            }

            // Parse dates safely
            const startDate = parseISO(cg.startDate);
            const endDate = parseISO(cg.endDate);

            if (!isValid(startDate) || !isValid(endDate)) {
                return false;
            }
            
            // The main filtering logic
            const isWithinDateRange = isWithinInterval(now, { start: startDate, end: endDate });
            const isCorrectShift = cg.shift === currentShift;
            const isCorrectDay = Array.isArray(cg.classDays) && cg.classDays.includes(currentDayNameInBrazil);
            
            return isWithinDateRange && isCorrectShift && isCorrectDay;
        });

        displayData = activeClassGroups
            .map(cg => ({
                id: cg.id,
                groupName: cg.name,
                shift: cg.shift,
                classroomName: cg.assignedClassroomId ? classroomMap.get(cg.assignedClassroomId) ?? null : null,
            }))
            .sort((a, b) => a.groupName.localeCompare(b.groupName));

    } catch (error) {
        console.error("Failed to get TV display data:", error);
        displayData = []; // Ensure it's an empty array on error
    }
  
  // Pass the fetched data to the client component for rendering.
  // The ClientRefresher component inside TvDisplayClient will trigger
  // this entire page component to re-run and re-fetch data periodically.
  return <TvDisplayClient data={displayData} />;
}
