// src/app/classrooms/[id]/edit/page.tsx
import { getClassroomById } from "@/lib/actions/classrooms";
import EditClassroomForm from "@/components/classrooms/EditClassroomForm";
import PageHeader from "@/components/shared/PageHeader";
import { notFound } from "next/navigation";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EditClassroomPageProps {
  params: {
    id: string;
  };
}

/**
 * Page for editing an existing classroom.
 * This is an async Server Component that fetches the classroom data on the server.
 * It ensures that only existing classrooms can be edited and handles cases where a classroom is not found.
 */
export default async function EditClassroomPage({ params }: EditClassroomPageProps) {
  const classroom = await getClassroomById(params.id);

  // If the classroom does not exist, render the 404 page.
  if (!classroom) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Sala de Aula"
        description={`Você está editando a sala: ${classroom.name}`}
        actions={
          <Button asChild variant="outline">
            <Link href="/classrooms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />
      <EditClassroomForm classroom={classroom} />
    </div>
  );
}
