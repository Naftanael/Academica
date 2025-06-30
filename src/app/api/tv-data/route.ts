
import { NextResponse } from 'next/server';
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import { getCurrentShift } from '@/lib/utils';
import { parseISO, isWithinInterval } from 'date-fns';
import { JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';

async function getTvDisplayData(): Promise<TvDisplayInfo[]> {
  try {
    const [classGroups, classrooms] = await Promise.all([
      readData<ClassGroup>('classgroups.json'),
      readData<Classroom>('classrooms.json'),
    ]);

    const nowUtc = new Date();
    const utcHour = nowUtc.getUTCHours();
    const utcDay = nowUtc.getUTCDay(); // 0 for Sunday, 1 for Monday...

    // Brazil is generally UTC-3. Calculate local time parts from UTC.
    const brazilHour = (utcHour - 3 + 24) % 24;
    // If it's 00, 01, or 02 UTC, it's the previous day in Brazil.
    const brazilDayIndex = utcHour < 3 ? (utcDay - 1 + 7) % 7 : utcDay;
    const currentDayNameInBrazil = JS_DAYS_OF_WEEK_MAP_TO_PT[brazilDayIndex];

    const currentShift = getCurrentShift(brazilHour);

    if (!currentShift) {
      return [];
    }

    const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));

    const activeClassGroups = classGroups.filter(cg => {
      const startDate = parseISO(cg.startDate);
      const endDate = parseISO(cg.endDate);
      
      return (
        cg.status === 'Em Andamento' &&
        isWithinInterval(nowUtc, { start: startDate, end: endDate }) && // Check against UTC time
        cg.shift === currentShift && // Check against calculated Brazil shift
        Array.isArray(cg.classDays) && cg.classDays.includes(currentDayNameInBrazil) // Check against calculated Brazil day
      );
    });

    const displayData = activeClassGroups.map(cg => ({
      id: cg.id,
      groupName: cg.name,
      shift: cg.shift,
      classroomName: cg.assignedClassroomId ? classroomMap.get(cg.assignedClassroomId) ?? null : null,
    }));

    return displayData.sort((a, b) => a.groupName.localeCompare(b.groupName));
  } catch (error) {
    console.error("Failed to get TV display data in API:", error);
    // In a real app, you might want more sophisticated logging/error handling
    return [];
  }
}

export async function GET() {
  const data = await getTvDisplayData();
  return NextResponse.json(data);
}
