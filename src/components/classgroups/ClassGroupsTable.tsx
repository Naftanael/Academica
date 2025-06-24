
'use client';

import Link from 'next/link';
import { UsersRound, Home, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { ClassGroup, Classroom } from '@/types';
import { DeleteClassGroupButton } from '@/components/classgroups/DeleteClassGroupButton';
import { EditClassGroupButton } from '@/components/classgroups/EditClassGroupButton';
import { ChangeClassroomDialog } from '@/components/classgroups/ChangeClassroomDialog';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from 'react';

interface ClassGroupsTableProps {
  classGroups: ClassGroup[];
  classrooms: Classroom[];
}

export default function ClassGroupsTable({ classGroups, classrooms }: ClassGroupsTableProps) {
  const classroomDetailsMap = React.useMemo(() =>
    new Map(classrooms.map(room => [room.id, { name: room.name, isUnderMaintenance: room.isUnderMaintenance || false, maintenanceReason: room.maintenanceReason }]))
  , [classrooms]);

  return (
    <TooltipProvider>
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Lista de Turmas ({classGroups.length})</CardTitle>
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
                    let maintenanceReasonText: string | undefined = undefined;

                    if (cg.assignedClassroomId) {
                      const roomDetails = classroomDetailsMap.get(cg.assignedClassroomId);
                      if (roomDetails) {
                        assignedClassroomDisplay = roomDetails.name;
                        isRoomInMaintenance = roomDetails.isUnderMaintenance;
                        maintenanceReasonText = roomDetails.maintenanceReason;
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
                            cg.status === 'Planejada' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-300 dark:border-blue-700'
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
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger>
                                <Wrench className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs bg-popover text-popover-foreground p-2 border shadow-md rounded-md">
                                <p className="font-semibold mb-1">Sala em manutenção</p>
                                {maintenanceReasonText && <p className="text-xs">{maintenanceReasonText}</p>}
                              </TooltipContent>
                            </Tooltip>
                          )}
                           <ChangeClassroomDialog
                              classGroup={cg}
                              availableClassrooms={classrooms.filter(c => !c.isUnderMaintenance || c.id === cg.assignedClassroomId)} // Allow current room even if in maintenance
                              triggerButton={
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
                                  <Home className="h-3.5 w-3.5 text-primary" />
                                  <span className="sr-only">{cg.assignedClassroomId ? "Trocar Sala" : "Atribuir Sala"}</span>
                                </Button>
                              }
                            />
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
    </TooltipProvider>
  );
}
