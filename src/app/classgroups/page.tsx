
import Link from 'next/link';
import { PlusCircle, UsersRound, Home } from 'lucide-react'; // GraduationCap removed, Home added
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms'; // Added
import type { ClassGroup, Classroom } from '@/types'; // Classroom added
import { DeleteClassGroupButton } from '@/components/classgroups/DeleteClassGroupButton';
import { EditClassGroupButton } from '@/components/classgroups/EditClassGroupButton';
import { ChangeClassroomDialog } from '@/components/classgroups/ChangeClassroomDialog'; // Added


export default async function ClassGroupsPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms(); // Added

  const classroomMap = new Map(classrooms.map(room => [room.id, room.name])); // Added

  return (
    <>
      <PageHeader
        title="Turmas"
        description="Gerencie as turmas da sua instituição."
        icon={UsersRound}
        actions={
          <Button asChild>
            <Link href="/classgroups/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Turma
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Turmas ({classGroups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {classGroups.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <UsersRound className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma turma cadastrada ainda.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/classgroups/new">
                  Cadastrar primeira turma
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Dias de Aula</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Sala Atribuída</TableHead> {/* Added */}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classGroups.map((cg: ClassGroup) => {
                  const assignedClassroomName = cg.assignedClassroomId 
                    ? classroomMap.get(cg.assignedClassroomId) || 'Desconhecida' 
                    : 'Não atribuída';
                  return (
                  <TableRow key={cg.id}>
                    <TableCell className="font-medium">{cg.name}</TableCell>
                    <TableCell>{cg.shift}</TableCell>
                    <TableCell>
                      {cg.classDays && cg.classDays.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cg.classDays.map(day => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {day.substring(0,3)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/D</span>
                      )}
                    </TableCell>
                    <TableCell><Badge variant={cg.status === 'Em Andamento' ? 'default' : cg.status === 'Planejada' ? 'secondary' : 'outline'}>{cg.status}</Badge></TableCell>
                    <TableCell>{cg.year}</TableCell>
                    <TableCell> {/* Sala Atribuída Cell */}
                      <div className="flex items-center gap-2">
                        <span>{assignedClassroomName}</span>
                        <ChangeClassroomDialog 
                          classGroup={cg} 
                          availableClassrooms={classrooms}
                          triggerButton={
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Home className="h-3.5 w-3.5" />
                              <span className="sr-only">Trocar Sala</span>
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <EditClassGroupButton classGroupId={cg.id} className="mr-2" />
                      <DeleteClassGroupButton classGroupId={cg.id} />
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
