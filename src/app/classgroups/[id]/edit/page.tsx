
import { getClassGroupById } from '@/lib/actions/classgroups';
import EditClassGroupView from '@/components/classgroups/EditClassGroupView';
import type { ClassGroup } from '@/types';

interface EditClassGroupPageProps {
  params: { id: string };
}

export default async function EditClassGroupPage({
  params,
}: EditClassGroupPageProps) {
  const classGroup: ClassGroup | undefined = (await getClassGroupById(params.id)) || undefined;

  // A lógica da view está agora num componente de cliente separado
  return <EditClassGroupView classGroup={classGroup} />;
}
