
import Link from 'next/link';
import { PlusCircle, UsersRound } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { ClassGroup, Classroom } from '@/types';
import ClassGroupsTable from '@/components/classgroups/ClassGroupsTable';

export default async function ClassGroupsPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();

  return (
    <>
      <PageHeader
        title="Turmas"
        description="Gerencie as turmas da sua instituição."
        icon={UsersRound}
        actions={
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/classgroups/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Turma
            </Link>
          </Button>
        }
      />
      <ClassGroupsTable classGroups={classGroups} classrooms={classrooms} />
    </>
  );
}
