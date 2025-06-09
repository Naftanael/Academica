
import Link from 'next/link';
import { PlusCircle, School, Edit, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getClassrooms, deleteClassroom } from '@/lib/actions/classrooms';
import type { Classroom } from '@/types';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { toast } from '@/hooks/use-toast';

function DeleteClassroomButton({ classroomId, className }: { classroomId: string, className?: string }) {
  'use client';
  const [isPending, setIsPending] = React.useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteClassroom(classroomId);
    setIsPending(false);
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message,
        variant: "default",
      });
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DeleteConfirmationDialog
      onConfirm={handleDelete}
      triggerButton={
        <Button variant="ghost" size="icon" className={className} disabled={isPending}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir Sala</span>
        </Button>
      }
      dialogTitle="Excluir Sala de Aula?"
      dialogDescription="Esta ação não pode ser desfeita. Todos os dados da sala serão removidos permanentemente."
    />
  );
}


export default async function ClassroomsPage() {
  const classrooms = await getClassrooms();

  return (
    <>
      <PageHeader
        title="Salas de Aula"
        description="Gerencie as salas de aula da sua instituição."
        icon={School}
        actions={
          <Button asChild>
            <Link href="/classrooms/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Sala
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Salas ({classrooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {classrooms.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <School className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma sala de aula cadastrada ainda.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/classrooms/new">
                  Cadastrar primeira sala
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classrooms.map((room: Classroom) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>{room.capacity ?? 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      {/* 
                      <Button variant="ghost" size="icon" asChild className="mr-2">
                        <Link href={`/classrooms/${room.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar Sala</span>
                        </Link>
                      </Button>
                      */}
                      <DeleteClassroomButton classroomId={room.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
