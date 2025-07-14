
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms'; // Corrected import path
import { getAnnouncements } from '@/lib/actions/announcements';
import type { ClassGroup, Classroom, TvDisplayInfo, Announcement } from '@/types';
import TvDisplayClient from '@/components/tv-display/TvDisplayClient';
import ClientRefresher from '@/components/tv-display/ClientRefresher';

/**
 * An asynchronous server-side function to fetch and process data for the TV panel.
 * This function has been refactored to fetch data directly from Firestore via server actions.
 */
async function getTvDisplayData() {
  // Fetch all necessary data directly from Firestore actions
  const [classGroups, classrooms, announcements] = await Promise.all([
    getClassGroups(),
    getClassrooms(),
    getAnnouncements(),
  ]);

  const classroomMap = new Map(classrooms.map(c => [c.id, c]));

  const tvData: TvDisplayInfo[] = classGroups
    .map(cg => {
        const classroom = cg.assignedClassroomId ? classroomMap.get(cg.assignedClassroomId) : undefined;
        return {
            id: cg.id,
            groupName: cg.name,
            shift: cg.shift,
            classroomName: classroom ? classroom.name : 'N/A',
            classDays: cg.classDays,
            startDate: cg.startDate,
            endDate: cg.endDate,
            status: cg.status,
            classroomCapacity: classroom ? classroom.capacity : undefined,
            isUnderMaintenance: classroom ? classroom.isUnderMaintenance : undefined,
        };
    })
    .sort((a, b) => ((a.classroomName ?? 'Z') > (b.classroomName ?? 'Z') ? 1 : -1));

  const publishedAnnouncements = announcements.filter(a => a.published);

  return {
    data: tvData,
    announcements: publishedAnnouncements,
    lastPublished: new Date().toISOString(),
  };
}

/**
 * The main component for the `/tv-display` route.
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
