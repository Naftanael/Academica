
import { getClassGroupById } from '@/lib/actions/classgroups';
import EditClassGroupView from '@/components/classgroups/EditClassGroupView';
import type { ClassGroup } from '@/types';

// A página permanece um Server Component, mas é muito mais simples.
// Ela busca os dados e os passa para um client component.
export default async function EditClassGroupPage({
  params,
}: {
  params: { id: string };
}) {
  const classGroup: ClassGroup | undefined = await getClassGroupById(params.id);

  // A lógica da view está agora num componente de cliente separado
  return <EditClassGroupView classGroup={classGroup} />;
}
