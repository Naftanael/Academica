
import { getClassGroupById } from '@/lib/actions/classgroups';
import { getCourses } from '@/lib/actions/courses';
import PageHeader from '@/components/shared/PageHeader';
import { UsersRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import EditClassGroupForm from '@/components/classgroups/EditClassGroupForm'; // To be created later

interface EditClassGroupPageProps {
  params: { id: string };
}

export default async function EditClassGroupPage({ params }: EditClassGroupPageProps) {
  const classGroup = await getClassGroupById(params.id);
  // const courses = await getCourses(); // Will be needed for the form

  if (!classGroup) {
    return (
      <>
        <PageHeader title="Turma não encontrada" icon={UsersRound} />
        <div className="max-w-2xl mx-auto text-center py-8">
          <p className="text-lg text-muted-foreground mb-6">A turma que você está tentando editar não foi encontrada ou não existe.</p>
          <Button variant="outline" asChild>
            <Link href="/classgroups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista de Turmas
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Editar Turma: ${classGroup.name}`}
        description="Modifique os dados da turma abaixo."
        icon={UsersRound}
        actions={
          <Button variant="outline" asChild>
            <Link href="/classgroups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Dados da Turma</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 
            Placeholder for the edit form.
            When created, EditClassGroupForm will be similar to NewClassGroupForm
            but pre-filled with classGroup data and will call an updateClassGroup action.
            <EditClassGroupForm classGroup={classGroup} courses={courses} /> 
          */}
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              O formulário para editar a turma <span className="font-semibold">{classGroup.name}</span> (ID: {classGroup.id}) será implementado aqui.
            </p>
            <p className="mt-4 text-sm">
              Ele será pré-preenchido com os dados da turma e permitirá a seleção de cursos.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
