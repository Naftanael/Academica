import PageHeader from '@/components/shared/PageHeader';
import { Search } from 'lucide-react';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { Classroom, ClassGroup } from '@/types';
import StudentSearchView from '@/components/student-search/StudentSearchView';

export default async function StudentSearchPage() {
  const classrooms: Classroom[] = await getClassrooms();
  const classGroups: ClassGroup[] = await getClassGroups();

  return (
    <>
      <PageHeader
        title="Consulta de Sala do Aluno"
        description="Encontre rapidamente a sala de aula da sua turma."
        icon={Search}
      />
      <div className="max-w-2xl mx-auto">
        <StudentSearchView allClassrooms={classrooms} allClassGroups={classGroups} />
      </div>
    </>
  );
}
