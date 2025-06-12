
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { ClassGroup, Classroom, ClassGroupShift } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TvDisplayClient, { type TvDisplayInfo } from '@/components/tv-display/TvDisplayClient';

function getCurrentShift(hour: number): ClassGroupShift {
  if (hour >= 6 && hour < 12) {
    return 'Manhã';
  } else if (hour >= 12 && hour < 18) {
    return 'Tarde';
  } else {
    return 'Noite';
  }
}

export default async function TvDisplayPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();

  const now = new Date();
  const currentHour = now.getHours();
  const currentShift = getCurrentShift(currentHour);

  const activeClassGroups = classGroups.filter(cg => {
    return cg.status === 'Em Andamento' && cg.shift === currentShift;
  });

  const displayData: TvDisplayInfo[] = activeClassGroups.map(group => {
    const classroom = classrooms.find(room => room.id === group.assignedClassroomId);
    return {
      id: group.id,
      groupName: group.name,
      shift: group.shift,
      classroomName: classroom ? classroom.name : null,
    };
  });

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

