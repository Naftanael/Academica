
import Link from 'next/link';
import { PlusCircle, School } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import ClassroomsDisplay from '@/components/classrooms/ClassroomsDisplay';
import type { Classroom, ClassGroup } from '@/types';

export default async function ClassroomsPage() {
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();

  return (
    <>
      <PageHeader
        title="Salas de Aula"
        description="Gerencie as salas de aula e veja sua ocupação atual."
        icon={School}
        actions={
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/classrooms/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Sala
            </Link>
          </Button>
        }
      />
      <ClassroomsDisplay classrooms={classrooms} classGroups={classGroups} />
    </>
  );
}
