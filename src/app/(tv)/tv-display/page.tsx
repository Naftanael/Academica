
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { ClassGroup, Classroom, ClassGroupShift } from '@/types';
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

  const activeClassGroups = allClassGroups.filter(cg => {
    // Ensure cg is a valid object with essential properties before proceeding
    if (!cg || typeof cg.status !== 'string' || typeof cg.shift !== 'string') {
      return false; // Skip malformed or incomplete class group objects
    }

    if (cg.status !== 'Em Andamento' || cg.shift !== currentShift) {
      return false;
    }

    // If assignedClassroomId exists, check if the room is under maintenance
    if (cg.assignedClassroomId) {
      const assignedRoom = allClassrooms.find(room => room?.id === cg.assignedClassroomId);
      // Safely access isUnderMaintenance, default to false if undefined (though schema implies it should exist)
      if (assignedRoom && (assignedRoom.isUnderMaintenance === true)) {
        return false; // Do not include if room is under maintenance
      }
    }
    return true;
  });

  const displayData: TvDisplayInfo[] = activeClassGroups
    .map(group => {
      // Ensure group is a valid object with essential properties for display
      if (!group || typeof group.id !== 'string' || typeof group.name !== 'string' || typeof group.shift !== 'string') {
        return null; // Mark as invalid to be filtered out
      }
      const classroom = allClassrooms.find(room => room?.id === group.assignedClassroomId);
      return {
        id: group.id,
        groupName: group.name,
        shift: group.shift as ClassGroupShift, // Type assertion after validation
        classroomName: classroom?.name ?? null, // Safely access classroom.name, provide null if not found or name is missing
      };
    })
    .filter(item => item !== null) as TvDisplayInfo[]; // Filter out any null entries from malformed groups

  return (
    <TvDisplayClient
      initialDisplayData={displayData}
    />
  );
}
