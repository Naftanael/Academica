
import { NextResponse } from 'next/server';
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import { getCurrentShift, isClassDay } from '@/lib/utils';
import { parseISO, isWithinInterval } from 'date-fns';

async function getTvDisplayData(): Promise<TvDisplayInfo[]> {
  try {
    const [classGroups, classrooms] = await Promise.all([
      readData<ClassGroup>('classgroups.json'),
      readData<Classroom>('classrooms.json'),
    ]);

    const now = new Date();
    const currentShift = getCurrentShift(now.getHours());

    if (!currentShift) {
      return [];
    }

    const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));

    const activeClassGroups = classGroups.filter(cg => {
      const startDate = parseISO(cg.startDate);
      const endDate = parseISO(cg.endDate);
      
      return (
        cg.status === 'Em Andamento' &&
        isWithinInterval(now, { start: startDate, end: endDate }) &&
        cg.shift === currentShift &&
        isClassDay(now, cg.classDays)
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
