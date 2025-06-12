
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

  // This date is for the header and is less frequently changing than the time.
  // The client component will manage its own live clock.
  const initialCurrentDateHeader = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <TvDisplayClient 
      initialDisplayData={displayData} 
      initialCurrentDateHeader={initialCurrentDateHeader} 
    />
  );
}
