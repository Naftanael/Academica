
import Link from 'next/link';
import { ArrowLeft, UsersRound } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NewClassGroupForm from '@/components/classgroups/NewClassGroupForm';
// getAppCursos import removed as it's no longer used

export default async function NewClassGroupPage() {
  // const appCursos = await getAppCursos(); // appCursos fetching removed

  return (
    <>
      <PageHeader
        title="Nova Turma"
        description="Preencha os dados para cadastrar uma nova turma."
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
          <NewClassGroupForm /* appCursos prop removed */ />
        </CardContent>
      </Card>
    </>
  );
}
