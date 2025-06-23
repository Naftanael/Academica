
import { getClassroomById } from '@/lib/actions/classrooms';
import EditClassroomView from '@/components/classrooms/EditClassroomView';
import type { Classroom } from '@/types';

export default async function EditClassroomPage({
  params,
}: {
  params: { id: string };
}) {
  const classroom: Classroom | undefined = await getClassroomById(params.id);

  return <EditClassroomView classroom={classroom} />;
}
