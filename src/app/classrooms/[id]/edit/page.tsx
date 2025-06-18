// src/app/classgroups/[id]/edit/page.tsx

import { getClassroomById } from '@/lib/actions/classrooms';
import PageHeader from '@/components/shared/PageHeader';
import { School, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditClassroomForm from '@/components/classrooms/ClassroomEditFormNEW';

export default async function EditClassroomPage({
  params,
}: {
  params: { id: string };
}) {
  const classroom = await getClassroomById(params.id);

  if (!classroom) {
    return (
      <>
        <PageHeader title="Sala não encontrada" icon={School} />
        <div className="max-w-2xl mx-auto text-center py-8">
          <p className="text-lg text-muted-foreground mb-6">
            A sala de aula que você está tentando editar não foi encontrada ou não existe.
          </p>
          <Button variant="outline" asChild className="hover:bg-accent hover:text-accent-foreground">
            <Link href="/classrooms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista de Salas
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Editar Sala: ${classroom.name}`}
        description="Modifique os dados da sala de aula abaixo."
        icon={School}
        actions={
          <Button variant="outline" asChild className="hover:bg-accent hover:text-accent-foreground">
            <Link href="/classrooms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Dados da Sala</CardTitle>
        </CardHeader>
        <CardContent>
          <EditClassroomForm classroom={classroom} />
        </CardContent>
      </Card>
    </>
  );
}
