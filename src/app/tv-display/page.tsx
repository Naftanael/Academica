
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import { getCurrentShift, isClassDay } from '@/lib/utils';
import TvDisplayClient from './TvDisplayClient';
import { parseISO, isWithinInterval } from 'date-fns';

async function getTvDisplayData(): Promise<TvDisplayInfo[]> {
  try {
    const [classGroups, classrooms] = await Promise.all([
      readData<ClassGroup>('classgroups.json'),
      readData<Classroom>('classrooms.json'),
    ]);

    const serverDate = new Date();
    // Assume um fuso horário UTC-3 para a localização da escola (ex: São Paulo, Brasil)
    const now = new Date(serverDate.valueOf() - 3 * 60 * 60 * 1000);
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
        isWithinInterval(serverDate, { start: startDate, end: endDate }) && // Verifica o intervalo com a hora UTC do servidor
        cg.shift === currentShift && // Verifica o turno com a hora local
        isClassDay(now, cg.classDays) // Verifica o dia da semana com a data local
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
    console.error("Failed to get TV display data:", error);
    return [];
  }
}

export default async function TvDisplayPage() {
  const displayData = await getTvDisplayData();
  
  return <TvDisplayClient initialData={displayData} />;
}
