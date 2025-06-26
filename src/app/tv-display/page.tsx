
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { ClassGroup, Classroom, TvDisplayInfo } from '@/types';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import { getCurrentShift } from '@/lib/utils';

// This is the main data-fetching logic for the TV display page.
// It runs on the server to prepare the initial data.
async function getTvDisplayData(): Promise<TvDisplayInfo[]> {
  try {
    const classGroups = await getClassGroups();
    const classrooms = await getClassrooms();

    const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
    const now = new Date();
    const currentShift = getCurrentShift(now.getHours());
    
    if (!currentShift) {
      // If it's outside of normal class hours, return empty array.
      return [];
    }

    const displayData: TvDisplayInfo[] = classGroups
      .filter(cg => cg.status === 'Em Andamento' && cg.shift === currentShift)
      .map(cg => ({
        id: cg.id,
        groupName: cg.name,
        shift: cg.shift,
        classroomName: cg.assignedClassroomId ? classroomMap.get(cg.assignedClassroomId) ?? null : null,
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));

    return displayData;
  } catch (error) {
    console.error("Failed to fetch initial TV display data:", error);
    return []; // Return empty on error
  }
}

export default async function TvDisplayPage() {
  const initialDisplayData = await getTvDisplayData();

  // The main container sets the background color and flex layout for the TV view.
  return (
    <div className="bg-primary min-h-screen flex flex-col">
      <TvDisplayClient initialDisplayData={initialDisplayData} />
    </div>
  );
}
