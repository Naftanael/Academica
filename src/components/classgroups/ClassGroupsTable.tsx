
import { getClassGroups } from '@/lib/actions/classgroups';
import { ClassGroupsTableClient } from './ClassGroupsTableClient';

export async function ClassGroupsTable() {
    const classGroups = await getClassGroups();

    return <ClassGroupsTableClient classGroups={classGroups} />;
}
