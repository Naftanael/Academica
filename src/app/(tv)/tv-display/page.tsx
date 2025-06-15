
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
  const allClassGroups = await getClassGroups();
  const allClassrooms = await getClassrooms();

  const now = new Date();
  const currentHour = now.getHours();
  const currentShift = getCurrentShift(currentHour);

  // Filter out class groups whose assigned classroom is under maintenance
  const activeClassGroups = allClassGroups.filter(cg => {
    if (cg.status !== 'Em Andamento' || cg.shift !== currentShift) {
      return false;
    }
    if (cg.assignedClassroomId) {
      const assignedRoom = allClassrooms.find(room => room.id === cg.assignedClassroomId);
      if (assignedRoom && assignedRoom.isUnderMaintenance) {
        return false; // Do not include if room is under maintenance
      }
    }
    return true;
  });

  const displayData: TvDisplayInfo[] = activeClassGroups.map(group => {
    const classroom = allClassrooms.find(room => room.id === group.assignedClassroomId);
    return {
      id: group.id,
      groupName: group.name,
      shift: group.shift,
      classroomName: classroom ? classroom.name : null, // If classroom is under maintenance, it would have been filtered already
    };
  });

  return (
    <TvDisplayClient
      initialDisplayData={displayData}
    />
  );
}
