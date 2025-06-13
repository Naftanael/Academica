
import { getClassroomById } from '@/lib/actions/classrooms';
import PageHeader from '@/components/shared/PageHeader';
import { School, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EditClassroomPageProps {
  params: { id: string };
}

export default async function EditClassroomPage({ params }: EditClassroomPageProps) {
  const classroom = await getClassroomById(params.id);

  if (!classroom) {
    return (
      <>
        <PageHeader title="Sala não encontrada" icon={School} />
        <div className="max-w-2xl mx-auto text-center py-8">
          <p className="text-lg text-muted-foreground mb-6">A sala de aula que você está tentando editar não foi encontrada ou não existe.</p>
          <Button variant="outline" asChild>
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
          <Button variant="outline" asChild>
            <Link href="/classrooms">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Dados da Sala</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              O formulário para editar a sala <span className="font-semibold">{classroom.name}</span> (ID: {classroom.id}) será implementado aqui.
            </p>
            <p className="mt-4 text-sm">
              Por enquanto, esta é uma página de espaço reservado.
            </p>
            {/* 
              Future implementation will include a form similar to 'src/app/classrooms/new/page.tsx',
              pre-filled with classroom data and using an 'updateClassroom' server action.
            */}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
