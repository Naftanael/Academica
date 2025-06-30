
'use client';

import Link from 'next/link';
import { PlusCircle, School, Users, CalendarDays, Clock, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Classroom, ClassGroup, DayOfWeek } from '@/types';
import { DeleteClassroomButton } from '@/components/classrooms/DeleteClassroomButton'; // Keep the original import here
import { EditClassroomButton } from '@/components/classrooms/EditClassroomButton';
import { JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { getCurrentShift } from '@/lib/utils'; // Import from utils
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from 'react';

interface ClassroomsDisplayProps {
  classrooms: Classroom[];
 classGroups: ClassGroup[];
}

export default function ClassroomsDisplay({ classrooms, classGroups }: ClassroomsDisplayProps) {
  const [currentHour, setCurrentHour] = React.useState<number | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    const now = new Date();
    setCurrentHour(now.getHours());
    setCurrentDayIndex(now.getDay());

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setCurrentDayIndex(now.getDay());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []); // Empty dependency array ensures this runs once on mount (client-side)

  const currentShift = getCurrentShift(currentHour);
  const currentDayName = currentDayIndex !== null ? JS_DAYS_OF_WEEK_MAP_TO_PT[currentDayIndex] : null;

  if (currentHour === null || currentDayIndex === null || !currentShift || !currentDayName) {
    // Render a loading state or placeholder until client-side hydration sets the time
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((room: Classroom) => (
                 <Card key={room.id} className={cn("shadow-lg rounded-lg flex flex-col", room.isUnderMaintenance && "border-amber-500 border-2 bg-amber-50 dark:bg-amber-900/30")}>
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start gap-2">
                            <CardTitle className="font-headline text-xl text-foreground break-words">
                            {room.name}
                            </CardTitle>
                            <div className="flex-shrink-0 space-x-1">
                                <EditClassroomButton classroomId={room.id} className="h-8 w-8 hover:bg-accent" />
                                <DeleteClassroomButton classroomId={room.id} className="h-8 w-8 hover:bg-destructive/10 text-destructive hover:text-destructive" />
                            </div>
                        </div>
                        <CardDescription>
                            Capacidade: {room.capacity ?? 'N/A'}
                        </CardDescription>
                         {room.isUnderMaintenance && (
                            <>
                            <Badge variant="destructive" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600">
                                <Wrench className="mr-2 h-3.5 w-3.5" />
                                Em Manutenção
                            </Badge>
                            </>
                        )}
                    </CardHeader>
                    <CardContent className="flex-grow">
                         <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground">Carregando status da sala...</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {classrooms.length === 0 && (
                <Card className="shadow-lg rounded-lg md:col-span-2 lg:col-span-3">
                    <CardContent>
                        <div className="text-center text-muted-foreground py-12">
                            <School className="mx-auto h-16 w-16 mb-6 text-primary" />
                            <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma sala de aula cadastrada.</h3>
                            <p className="mb-6">
                                Comece cadastrando a primeira sala para sua instituição.
                            </p>
                            <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Link href="/classrooms/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Cadastrar Primeira Sala
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
  }


  return (
    <TooltipProvider>
      {classrooms.length === 0 ? (
        <Card className="shadow-lg rounded-lg">
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <School className="mx-auto h-16 w-16 mb-6 text-primary" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma sala de aula cadastrada.</h3>
              <p className="mb-6">
                Comece cadastrando a primeira sala para sua instituição.
              </p>
              <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/classrooms/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Sala
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((room: Classroom) => {
            const occupyingGroup = !room.isUnderMaintenance ? classGroups.find(cg =>
              cg.assignedClassroomId === room.id &&
              cg.status === 'Em Andamento' &&
              Array.isArray(cg.classDays) && cg.classDays.includes(currentDayName as DayOfWeek) && // currentDayName is now guaranteed to be DayOfWeek or null
 cg.shift === currentShift // currentShift is also guaranteed
            ) : undefined;

            return (
              <Card key={room.id} className={cn("shadow-lg rounded-lg flex flex-col", room.isUnderMaintenance && "border-amber-500 border-2 bg-amber-50 dark:bg-amber-900/30")}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="font-headline text-xl text-foreground break-words">
                      {room.name}
                    </CardTitle>
                    <div className="flex-shrink-0 space-x-1">
                      <EditClassroomButton classroomId={room.id} className="h-8 w-8 hover:bg-accent" />
                      <DeleteClassroomButton classroomId={room.id} className="h-8 w-8 hover:bg-destructive/10 text-destructive hover:text-destructive" />
                    </div>
                  </div>
                  <CardDescription>
                    Capacidade: {room.capacity ?? 'N/A'}
                  </CardDescription>
                   {room.isUnderMaintenance && (
                    <>
                      <Badge variant="destructive" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600">
                        <Wrench className="mr-2 h-3.5 w-3.5" />
                        Em Manutenção
                      </Badge>
                      {room.maintenanceReason && (
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5 cursor-help underline decoration-dotted decoration-amber-500/50 hover:decoration-amber-500">
                              Motivo: {room.maintenanceReason.substring(0, 40)}{room.maintenanceReason.length > 40 ? '...' : ''}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs bg-popover text-popover-foreground p-2 border shadow-md rounded-md">
                            <p className="font-semibold mb-1">Motivo da Manutenção:</p>
                            <p className="text-xs">{room.maintenanceReason}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </>
                  )}
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="border-t pt-4">
                    {room.isUnderMaintenance ? (
                       <div className="space-y-1.5">
                        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium flex items-center">
                          <Wrench className="mr-2 h-4 w-4 " />
                          Sala indisponível.
                        </p>
                      </div>
                    ) : occupyingGroup ? (
                      <div className="space-y-1.5">
                        <Badge variant="destructive" className="text-xs mb-2">Ocupada Agora</Badge>
                        <p className="text-sm text-foreground flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          Turma: <span className="font-medium ml-1">{occupyingGroup.name}</span>
                        </p>
                        <p className="text-sm text-foreground flex items-center">
                          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                           Hoje: <span className="font-medium ml-1">{currentDayName}</span>
                        </p>
                        <p className="text-sm text-foreground flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          Turno: <span className="font-medium ml-1">{currentShift}</span>
                        </p>
                      </div>
                    ) : (
                       <div className="space-y-1.5">
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30 text-xs mb-2">
                          Livre Agora
                        </Badge>
                         <p className="text-sm text-muted-foreground flex items-center">
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Hoje: <span className="font-medium ml-1">{currentDayName}</span>
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          Turno Atual: <span className="font-medium ml-1">{currentShift}</span>
                        </p>
                       </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </TooltipProvider>
  );
}
