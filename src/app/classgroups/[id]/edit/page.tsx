
import { getClassGroupById } from '@/lib/actions/classgroups';
import EditClassGroupView from '@/components/classgroups/EditClassGroupView';
import type { ClassGroup } from '@/types';

// The page remains a Server Component, but is much simpler.
// It fetches data and passes it to a client component.
export default async function EditClassGroupPage({
  params,
}: {
  params: { id: string };
}) {
  const classGroup: ClassGroup | undefined = await getClassGroupById(params.id);

  // The view logic is now in a separate client component
  return <EditClassGroupView classGroup={classGroup} />;
}
