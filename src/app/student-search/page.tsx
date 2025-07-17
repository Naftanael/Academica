
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import StudentSearchView from '@/components/student-search/StudentSearchView';
import PageHeader from '@/components/shared/PageHeader';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function StudentSearchPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();

  return (
    <>
      <PageHeader
        title="Busca de Alunos"
        description="Encontre rapidamente as informações de matrícula de um aluno."
      />
      <div className="max-w-2xl mx-auto">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <StudentSearchView classrooms={classrooms} classGroups={classGroups} />
        </Suspense>
      </div>
    </>
 );
}
