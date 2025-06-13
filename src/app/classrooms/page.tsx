
import Link from 'next/link';
import { PlusCircle, School } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { Classroom } from '@/types';
import { DeleteClassroomButton } from '@/components/classrooms/DeleteClassroomButton';
import { EditClassroomButton } from '@/components/classrooms/EditClassroomButton';

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
          <CardTitle className="font-headline">Lista de Salas ({classrooms.length})</CardTitle>
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
                      <EditClassroomButton classroomId={room.id} className="mr-2" />
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
