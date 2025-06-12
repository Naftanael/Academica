
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { ClassGroup, Classroom } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TvDisplayClient, { type TvDisplayInfo } from '@/components/tv-display/TvDisplayClient';

export default async function TvDisplayPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();

  const activeClassGroups = classGroups.filter(cg => cg.status === 'Em Andamento');

  const displayData: TvDisplayInfo[] = activeClassGroups.map(group => {
    const classroom = classrooms.find(room => room.id === group.assignedClassroomId);
    return {
      id: group.id,
      groupName: group.name,
      shift: group.shift,
      classroomName: classroom ? classroom.name : null,
    };
  });

  const now = new Date();
  const initialCurrentDateHeader = format(now, "EEEE, dd 'de' MMMM", { locale: ptBR });
  const initialCurrentTime = format(now, "HH:mm", { locale: ptBR });

  return (
    <TvDisplayClient
      initialDisplayData={displayData}
      initialCurrentDateHeader={initialCurrentDateHeader}
      initialCurrentTime={initialCurrentTime}
    />
  );
}
