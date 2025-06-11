
import PageHeader from '@/components/shared/PageHeader';
import { CalendarDays, School } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { Classroom, ClassGroup, DayOfWeek } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';

export default async function RoomAvailabilityPage() {
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();

  const getScheduledGroups = (classroomId: string, day: DayOfWeek): ClassGroup[] => {
    return classGroups.filter(cg => 
      cg.assignedClassroomId === classroomId && 
      cg.classDays.includes(day)
    );
  };

  return (
    <>
      <PageHeader
        title="Disponibilidade de Salas"
        description="Visualize a ocupação das salas de aula com base nas turmas agendadas."
        icon={CalendarDays}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quadro de Ocupação Semanal por Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          {classrooms.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <School className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma sala de aula cadastrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Sala</TableHead>
                    {DAYS_OF_WEEK.map(day => (
                      <TableHead key={day} className="min-w-[180px] text-center">{day}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classrooms.map((room: Classroom) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium sticky left-0 bg-card ">{room.name}</TableCell>
                      {DAYS_OF_WEEK.map(day => {
                        const scheduled = getScheduledGroups(room.id, day);
                        return (
                          <TableCell key={day} className="text-center align-top">
                            {scheduled.length > 0 ? (
                              <div className="flex flex-col gap-1 items-center">
                                {scheduled.map(cg => (
                                  <Badge key={cg.id} variant="secondary" className="text-xs whitespace-nowrap">
                                    {cg.name} ({cg.shift})
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Livre</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
           <p className="text-xs text-muted-foreground mt-4">
            Nota: Este quadro reflete a ocupação padrão com base nos dias de aula e turnos definidos para as turmas. Reservas pontuais não estão incluídas nesta visualização.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
