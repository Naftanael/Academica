
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import { getCurrentShift } from '@/lib/utils'; // Import from utils

export default async function TvDisplayPage() {
  const allClassGroups = await getClassGroups();
  const allClassrooms = await getClassrooms();

  const now = new Date();
  const currentHour = now.getHours();
  const currentShift = getCurrentShift(currentHour);

  const activeClassGroups = allClassGroups.filter(cg => {
    // Ensure cg is a valid object with essential properties before proceeding
    if (!cg || typeof cg !== 'object' || cg === null) {
        console.warn(`TV Display: Skipping class group due to invalid object: ${JSON.stringify(cg)}`);
        return false;
    }
    if (typeof cg.status !== 'string' || typeof cg.shift !== 'string') {
      console.warn(`TV Display: Skipping class group with missing/invalid status or shift: ${cg.id}`);
      return false; 
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
        console.warn(`TV Display: Skipping class group with missing/invalid id, name, or shift for display: ${JSON.stringify(group)}`);
        return null; // Mark as invalid to be filtered out
      }
      const classroom = allClassrooms.find(room => room?.id === group.assignedClassroomId);
      return {
        id: group.id,
        groupName: group.name,
        shift: group.shift, 
        classroomName: (classroom && typeof classroom.name === 'string') ? classroom.name : null,
      };
    })
    .filter(item => item !== null) as TvDisplayInfo[]; // Filter out any null entries from malformed groups

  return (
    <TvDisplayClient
      initialDisplayData={displayData}
    />
  );
}
