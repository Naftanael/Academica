import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo, ClassGroupStatus } from '@/types';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import './tv-display.css';
import ClientRefresher from '@/components/tv-display/ClientRefresher';

// The TvDisplayInfo from types/index.ts will be updated to include status.
interface TvDisplayInfoWithStatus extends TvDisplayInfo {
  status: ClassGroupStatus;
}

// This is now a Server Component
async function getTvDisplayData() {
  const [classGroups, classrooms] = await Promise.all([
    readData<ClassGroup>('classgroups.json'),
    readData<Classroom>('classrooms.json'),
  ]);

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));

  const tvData: TvDisplayInfoWithStatus[] = classGroups
    .map(cg => ({
      id: cg.id,
      groupName: cg.name,
      shift: cg.shift,
      classroomName: cg.assignedClassroomId ? (classroomMap.get(cg.assignedClassroomId) ?? 'Não Atribuída') : 'Não Atribuída',
      classDays: cg.classDays,
      startDate: cg.startDate,
      endDate: cg.endDate,
      status: cg.status,
    }))
    .sort((a, b) => ((a.classroomName ?? 'Z') > (b.classroomName ?? 'Z') ? 1 : -1));

  return {
    data: tvData,
    lastPublished: new Date().toISOString(),
  };
}


export default async function TvDisplayPage() {
    const { data, lastPublished } = await getTvDisplayData();

    return (
        <>
            <ClientRefresher />
            <TvDisplayClient allGroups={data} lastPublished={lastPublished} />
        </>
    );
}
