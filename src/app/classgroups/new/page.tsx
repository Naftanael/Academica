
import Link from 'next/link';
import { ArrowLeft, UsersRound } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NewClassGroupForm from '@/components/classgroups/NewClassGroupForm';


export default function NewClassGroupPage() {
  return (
    <>
       <PageHeader
        title="Criar Nova Turma"
        description="Preencha os dados para criar uma nova turma."
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
       <Card className="max-w-4xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Dados da Nova Turma</CardTitle>
          <CardDescription>
            Forneça as informações básicas para o cadastro da turma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewClassGroupForm />
        </CardContent>
      </Card>
    </>
  );
}
