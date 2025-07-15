// src/components/classgroups/ClassGroupsTable.tsx
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import { ClassGroupsTableClient } from './ClassGroupsTableClient'; // We will create this next

/**
 * Server Component to fetch data required for the class groups table.
 * It fetches both class groups and classrooms, then passes them to the client component for rendering.
 * This keeps data fetching on the server and interactivity on the client.
 */
export default async function ClassGroupsTable() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();

  return <ClassGroupsTableClient classGroups={classGroups} classrooms={classrooms} />;
}
