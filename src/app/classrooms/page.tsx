
import Link from 'next/link';
import { PlusCircle, School, Users, CalendarDays, Clock, Wrench } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { Classroom, ClassGroup, DayOfWeek, PeriodOfDay } from '@/types';
import { DeleteClassroomButton } from '@/components/classrooms/DeleteClassroomButton';
import { EditClassroomButton } from '@/components/classrooms/EditClassroomButton';
import { JS_DAYS_OF_WEEK_PT } from '@/lib/constants'; 
import { cn } from '@/lib/utils';

// Helper function to get current shift based on hour
function getCurrentShift(hour: number): PeriodOfDay {
  if (hour >= 6 && hour < 12) {
    return 'Manhã';
  } else if (hour >= 12 && hour < 18) {
    return 'Tarde';
  } else {
    return 'Noite';
  }
}

export default async function ClassroomsPage() {
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();

  const now = new Date();
  const currentHour = now.getHours();
  const currentDayIndex = now.getDay(); // 0 for Sunday, 1 for Monday...
  
  const currentShift = getCurrentShift(currentHour);
  const currentDayName = JS_DAYS_OF_WEEK_PT[currentDayIndex];

  return (
    <>
      <PageHeader
        title="Salas de Aula"
        description="Gerencie as salas de aula e veja sua ocupação atual."
        icon={School}
        actions={
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/classrooms/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Sala
            </Link>
          </Button>
        }
      />
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
              cg.classDays.includes(currentDayName as DayOfWeek) && 
              cg.shift === currentShift
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
                    <Badge variant="destructive" className="mt-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600">
                      <Wrench className="mr-2 h-3.5 w-3.5" />
                      Em Manutenção
                    </Badge>
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
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300 dark:bg-green-700/30 dark:text-green-200 dark:border-green-600 text-xs mb-2">
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
    </>
  );
}
