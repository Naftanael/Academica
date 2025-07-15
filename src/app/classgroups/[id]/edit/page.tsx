// src/app/classgroups/[id]/edit/page.tsx
import { getClassGroupById } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import EditClassGroupForm from '@/components/classgroups/EditClassGroupForm'; // We will create/refactor this next
import PageHeader from '@/components/shared/PageHeader';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EditClassGroupPageProps {
  params: { id: string };
}

/**
 * Page for editing an existing class group.
 * It fetches both the class group data and the list of available classrooms on the server.
 */
export default async function EditClassGroupPage({ params }: EditClassGroupPageProps) {
  const classGroup = await getClassGroupById(params.id);
  
  // If the class group doesn't exist, show a 404 page.
  if (!classGroup) {
    notFound();
  }
  
  // Fetch available classrooms to be passed to the form for the assignment feature.
  const classrooms = await getClassrooms();

  return (
    <div className="space-y-6">
       <PageHeader
        title="Editar Turma"
        description={`Você está editando a turma: ${classGroup.name}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/classgroups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      
      <EditClassGroupForm classGroup={classGroup} availableClassrooms={classrooms} />
    </div>
  );
}
