
import { getClassGroupById } from '@/lib/actions/classgroups';
import PageHeader from '@/components/shared/PageHeader';
import { UsersRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditClassGroupForm from '@/components/classgroups/EditClassGroupForm';
import type { ClassGroup } from '@/types';

// Usando tipagem inline direta para máxima clareza e para evitar conflitos de tipo.
export default async function EditClassGroupPage({
  params,
}: {
  params: { id: string };
}) {
  const classGroup: ClassGroup | undefined = await getClassGroupById(params.id);

  if (!classGroup) {
    return (
      <>
        <PageHeader title="Turma não encontrada" icon={UsersRound} />
        <div className="max-w-2xl mx-auto text-center py-8">
          <p className="text-lg text-muted-foreground mb-6">
            A turma que você está tentando editar não foi encontrada ou não existe.
          </p>
          <Button
            variant="outline"
            asChild
            className="hover:bg-accent hover:text-accent-foreground"
          >
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
          <Button
            variant="outline"
            asChild
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <Link href="/classgroups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Dados da Turma</CardTitle>
        </CardHeader>
        <CardContent>
          <EditClassGroupForm classGroup={classGroup} />
        </CardContent>
      </Card>
    </>
  );
}
