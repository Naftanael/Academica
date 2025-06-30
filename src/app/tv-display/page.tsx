
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, ClassroomRecurringReservation, TvDisplayInfo } from '@/types';
import { getCurrentShift, isClassDay } from '@/lib/utils';
import TvDisplayClient from './TvDisplayClient';
import { parseISO, isWithinInterval, getDay } from 'date-fns';

const dayOfWeekMapping: Record<string, number> = {
  'Domingo': 0,
  'Segunda': 1,
  'Terça': 2,
  'Quarta': 3,
  'Quinta': 4,
  'Sexta': 5,
  'Sábado': 6
};

export default async function TvDisplayPage() {
  // 1. Read all necessary data
  const classGroups = await readData<ClassGroup>('classgroups.json');
  const classrooms = await readData<Classroom>('classrooms.json');
  const recurringReservations = await readData<ClassroomRecurringReservation>('recurring_reservations.json');

  // 2. Prepare for data processing
  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
  const classGroupMap = new Map(classGroups.map(cg => [cg.id, cg]));
  
  const now = new Date();
  const currentShift = getCurrentShift(now.getHours());
  const todayDayOfWeek = getDay(now);

  let displayData: TvDisplayInfo[] = [];

  // 3. Process data only if it's a valid shift
  if (currentShift) {
    // Filter recurring reservations to find active ones for today
    const activeReservations = recurringReservations.filter(res => {
      const startDate = parseISO(res.startDate);
      const endDate = parseISO(res.endDate);
      
      // Check if today is within the reservation's date range
      const isDateInRange = isWithinInterval(now, { start: startDate, end: endDate });
      if (!isDateInRange) return false;

      // Check if the reservation is for the current shift
      if (res.shift !== currentShift) return false;

      // Check if today is a scheduled class day for the group
      const classGroup = classGroupMap.get(res.classGroupId);
      if (!classGroup) return false;

      const numericalClassDays = classGroup.classDays.map(d => dayOfWeekMapping[d]);
      return numericalClassDays.includes(todayDayOfWeek);
    });

    // 4. Map active reservations to display data
    displayData = activeReservations
      .map(res => {
        const classGroup = classGroupMap.get(res.classGroupId);
        // Ensure classGroup is not undefined before creating display info
        if (!classGroup) return null;

        return {
          id: classGroup.id,
          groupName: classGroup.name,
          shift: classGroup.shift,
          classroomName: res.classroomId ? classroomMap.get(res.classroomId) ?? null : null,
        };
      })
      .filter((item): item is TvDisplayInfo => item !== null) // Filter out nulls
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }
  
  // 5. Render the client component with the processed data
  return <TvDisplayClient initialData={displayData} />;
}
