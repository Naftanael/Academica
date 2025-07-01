/**
 * @file src/app/tv-display/page.tsx
 * @description This is the main page for the TV display. It's a React Server Component (RSC)
 *              that now features a robust, data-adaptive loading mechanism.
 */
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo, ClassGroupStatus } from '@/types';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import './tv-display.css';
import ClientRefresher from '@/components/tv-display/ClientRefresher';

interface TvDisplayInfoWithStatus extends TvDisplayInfo {
  status: ClassGroupStatus;
}

/**
 * An asynchronous server-side function to fetch and process data for the TV display.
 * This function has been completely refactored to be data-adaptive. It dynamically adjusts
 * the year of the class group dates to match the current year, making the data always relevant.
 *
 * @returns {Promise<{ data: TvDisplayInfoWithStatus[], lastPublished: string }>}
 *          An object containing the processed list of class groups and a timestamp.
 */
async function getTvDisplayData() {
  const [classGroups, classrooms] = await Promise.all([
    readData<ClassGroup>('classgroups.json'),
    readData<Classroom>('classrooms.json'),
  ]);

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
  const currentYear = new Date().getFullYear();

  // This is the core of the new robust logic.
  // We process each class group to ensure its dates are relevant to the current year.
  const adaptedClassGroups = classGroups.map(cg => {
    // Create new Date objects from the original start and end dates.
    const startDate = new Date(cg.startDate);
    const endDate = new Date(cg.endDate);

    // Dynamically set the year of the start and end dates to the current year.
    // This makes the demo data timeless and solves the root cause of the display issue.
    startDate.setFullYear(currentYear);
    endDate.setFullYear(currentYear);

    // Return a new object with the updated, "live" dates.
    return {
      ...cg,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  });

  const tvData: TvDisplayInfoWithStatus[] = adaptedClassGroups
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

/**
 * The main component for the `/tv-display` route. It fetches time-adapted data on the server
 * and passes it to the client for rendering.
 */
export default async function TvDisplayPage() {
    const { data, lastPublished } = await getTvDisplayData();

    return (
        <>
            <ClientRefresher />
            <TvDisplayClient allGroups={data} lastPublished={lastPublished} />
        </>
    );
}
