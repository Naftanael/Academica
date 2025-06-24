
import Link from 'next/link';
import { ArrowLeft, School } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NewClassroomForm from '@/components/classrooms/NewClassroomForm';

export default function NewClassroomPage() {
  return (
    <>
      <PageHeader
        title="Nova Sala de Aula"
        description="Preencha os dados para cadastrar uma nova sala."
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
          <NewClassroomForm />
        </CardContent>
      </Card>
    </>
  );
}
