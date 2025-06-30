
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import { getCurrentShift } from '@/lib/utils';
import TvDisplayClient from './TvDisplayClient';

export default async function TvDisplayPage() {
  const classGroups = await readData<ClassGroup>('classgroups.json');
  const classrooms = await readData<Classroom>('classrooms.json');

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
  const now = new Date();
  const currentShift = getCurrentShift(now.getHours());
  
  let displayData: TvDisplayInfo[] = [];
  if (currentShift) {
    displayData = classGroups
      .filter(cg => cg.status === 'Em Andamento' && cg.shift === currentShift)
      .map(cg => ({
        id: cg.id,
        groupName: cg.name,
        shift: cg.shift,
        classroomName: cg.assignedClassroomId ? classroomMap.get(cg.assignedClassroomId) ?? null : null,
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  }
  
  return <TvDisplayClient initialData={displayData} />;
}
