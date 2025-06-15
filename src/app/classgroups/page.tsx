
import Link from 'next/link';
import { PlusCircle, UsersRound, Home, Wrench } from 'lucide-react'; 
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms'; 
import type { ClassGroup, Classroom } from '@/types'; 
import { DeleteClassGroupButton } from '@/components/classgroups/DeleteClassGroupButton';
import { EditClassGroupButton } from '@/components/classgroups/EditClassGroupButton';
import { ChangeClassroomDialog } from '@/components/classgroups/ChangeClassroomDialog'; 
import { cn } from '@/lib/utils';


export default async function ClassGroupsPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms(); 

  const classroomDetailsMap = new Map(classrooms.map(room => [room.id, {name: room.name, isUnderMaintenance: room.isUnderMaintenance || false }]));

  return (
    <>
      <PageHeader
        title="Turmas"
        description="Gerencie as turmas da sua instituição."
        icon={UsersRound}
        actions={
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/classgroups/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Turma
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle  className="font-headline text-xl">Lista de Turmas ({classGroups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {classGroups.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <UsersRound className="mx-auto h-12 w-12 mb-4 text-primary" />
              <p className="text-lg">Nenhuma turma cadastrada ainda.</p>
              <Button asChild variant="link" className="mt-2 text-primary">
                <Link href="/classgroups/new">
                  Cadastrar primeira turma
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Turno</TableHead>
                    <TableHead className="font-semibold">Dias de Aula</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Ano</TableHead>
                    <TableHead className="font-semibold">Sala Atribuída</TableHead> 
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classGroups.map((cg: ClassGroup) => {
                    let assignedClassroomDisplay = 'Não atribuída';
                    let isRoomInMaintenance = false;
                    if (cg.assignedClassroomId) {
                      const roomDetails = classroomDetailsMap.get(cg.assignedClassroomId);
                      if (roomDetails) {
                        assignedClassroomDisplay = roomDetails.name;
                        isRoomInMaintenance = roomDetails.isUnderMaintenance;
                      } else {
                        assignedClassroomDisplay = 'Desconhecida';
                      }
                    }
                    
                    return (
                    <TableRow key={cg.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{cg.name}</TableCell>
                      <TableCell>{cg.shift}</TableCell>
                      <TableCell>
                        {cg.classDays && cg.classDays.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cg.classDays.map(day => (
                              <Badge key={day} variant="secondary" className="text-xs font-medium">
                                {day.substring(0,3)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/D</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            cg.status === 'Em Andamento' ? 'default' : 
                            cg.status === 'Planejada' ? 'secondary' : 
                            cg.status === 'Concluída' ? 'outline' : 
                            'destructive' 
                          }
                          className={cn(
                            cg.status === 'Em Andamento' && 'bg-green-500 text-white dark:bg-green-600 dark:text-green-50', 
                            cg.status === 'Planejada' && 'bg-blue-500 text-white dark:bg-blue-600 dark:text-blue-50',
                            cg.status === 'Concluída' && 'border-gray-500 text-gray-700 dark:border-gray-400 dark:text-gray-300',
                            cg.status === 'Cancelada' && 'bg-red-500 text-white dark:bg-red-600 dark:text-red-50'
                          )}
                        >
                          {cg.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{cg.year}</TableCell>
                      <TableCell> 
                        <div className="flex items-center gap-1.5">
                          <span className={cn(isRoomInMaintenance && "text-amber-600 dark:text-amber-400")}>{assignedClassroomDisplay}</span>
                          {isRoomInMaintenance && (
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Wrench className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Sala em manutenção</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                           {!isRoomInMaintenance && cg.assignedClassroomId && (
                             <ChangeClassroomDialog 
                              classGroup={cg} 
                              availableClassrooms={classrooms.filter(c => !c.isUnderMaintenance)} // Apenas salas não em manutenção
                              triggerButton={
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
                                  <Home className="h-3.5 w-3.5 text-primary" />
                                  <span className="sr-only">Trocar Sala</span>
                                </Button>
                              }
                            />
                           )}
                           {!cg.assignedClassroomId && (
                             <ChangeClassroomDialog 
                              classGroup={cg} 
                              availableClassrooms={classrooms.filter(c => !c.isUnderMaintenance)}
                              triggerButton={
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
                                  <Home className="h-3.5 w-3.5 text-primary" />
                                  <span className="sr-only">Atribuir Sala</span>
                                </Button>
                              }
                            />
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <EditClassGroupButton classGroupId={cg.id} />
                        <DeleteClassGroupButton classGroupId={cg.id} />
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
