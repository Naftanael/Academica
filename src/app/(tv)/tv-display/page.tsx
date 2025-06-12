
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { ClassGroup, Classroom, ClassGroupShift } from '@/types';
// format from date-fns is no longer needed here for initial render
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

  const now = new Date(); // Server's current time
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

  // initialCurrentDateHeader and initialCurrentTime are no longer passed
  // TvDisplayClient will handle its own date/time initialization client-side

  return (
    <TvDisplayClient
      initialDisplayData={displayData}
      // initialCurrentDateHeader and initialCurrentTime props removed
    />
  );
}
