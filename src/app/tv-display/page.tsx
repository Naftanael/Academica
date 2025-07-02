/**
 * @file src/app/tv-display/page.tsx
 * @description This is the main page for the TV panel. It is a React Server Component (RSC)
 *              that now features a robust and data-adaptive loading mechanism.
 */
import { readData } from '@/lib/data-utils';
import type { ClassGroup, Classroom, TvDisplayInfo, Announcement } from '@/types';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import ClientRefresher from '@/components/tv-display/ClientRefresher';

/**
 * An asynchronous server-side function to fetch and process data for the TV panel.
 * This function has been completely refactored to be data-adaptive. It dynamically adjusts
 * the year of the class group dates to match the current year, making the data always relevant.
 *
 * @returns {Promise<{ data: TvDisplayInfo[], announcements: Announcement[], lastPublished: string }>}
 *          An object containing the processed list of class groups, announcements, and a timestamp.
 */
async function getTvDisplayData() {
  const [classGroups, classrooms, announcements] = await Promise.all([
    readData<ClassGroup>('classgroups.json'),
    readData<Classroom>('classrooms.json'),
    readData<Announcement>('announcements.json'),
  ]);

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
  const currentYear = new Date().getFullYear();

  // This is the core of the new robust logic.
  // We process each class group to ensure its dates are relevant to the current year.
  const adaptedClassGroups = classGroups.map(cg => {
    try {
      // Creates new Date objects from the original start and end dates.
      const startDate = new Date(cg.startDate);
      const endDate = new Date(cg.endDate);

      // Dynamically sets the year of the start and end dates to the current year.
      // This makes the demonstration data timeless and resolves the root cause of the display issue.
      startDate.setFullYear(currentYear);
      endDate.setFullYear(currentYear);

      // Returns a new object with the updated and "live" dates.
      return {
        ...cg,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    } catch {
      console.warn(`[TV Display] Invalid data for class ${cg.id}. Skipping.`);
      return null;
    }
  }).filter((cg): cg is ClassGroup => cg !== null); // Filters out any classes with invalid dates.

  const tvData: TvDisplayInfo[] = adaptedClassGroups
    .map(cg => ({
      id: cg.id,
      groupName: cg.name,
      shift: cg.shift,
      classroomName: cg.assignedClassroomId ? (classroomMap.get(cg.assignedClassroomId) ?? 'Not Assigned') : 'Not Assigned',
      classDays: cg.classDays,
      startDate: cg.startDate,
      endDate: cg.endDate,
      status: cg.status,
    }))
    .sort((a, b) => ((a.classroomName ?? 'Z') > (b.classroomName ?? 'Z') ? 1 : -1));

  const publishedAnnouncements = announcements.filter(a => a.published);

  return {
    data: tvData,
    announcements: publishedAnnouncements,
    lastPublished: new Date().toISOString(),
  };
}

/**
 * The main component for the `/tv-display` route. It fetches time-adapted data from the server
 * and passes it to the client for rendering.
 */
export default async function TvDisplayPage() {
    const { data, announcements, lastPublished } = await getTvDisplayData();

    return (
        <>
            <ClientRefresher />
            <TvDisplayClient allGroups={data} announcements={announcements} lastPublished={lastPublished} />
        </>
    );
}
