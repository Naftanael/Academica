
import Link from 'next/link';
import { PlusCircle, ListChecks, CalendarX2, Edit, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getRecurringReservations } from '@/lib/actions/recurring_reservations';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { ClassroomRecurringReservation, Classroom, ClassGroup, DayOfWeek } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteRecurringReservationButton } from '@/components/reservations/DeleteRecurringReservationButton';

interface EnrichedReservation extends ClassroomRecurringReservation {
  classroomName: string;
  classGroupName: string;
  classGroupDays: DayOfWeek[];
  formattedStartDate: string;
  formattedEndDate: string;
}

export default async function ReservationsPage() {
  const reservations = await getRecurringReservations();
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
  const classGroupMap = new Map(classGroups.map(cg => [cg.id, { name: cg.name, classDays: cg.classDays }]));

  const enrichedReservations: EnrichedReservation[] = reservations.map(res => {
    const classGroupDetails = classGroupMap.get(res.classGroupId);
    return {
      ...res,
      classroomName: classroomMap.get(res.classroomId) || 'Sala desconhecida',
      classGroupName: classGroupDetails?.name || 'Turma desconhecida',
      classGroupDays: classGroupDetails?.classDays || [],
      formattedStartDate: format(parseISO(res.startDate), "dd/MM/yy", { locale: ptBR }),
      formattedEndDate: format(parseISO(res.endDate), "dd/MM/yy", { locale: ptBR }),
    };
  });

  return (
    <>
      <PageHeader
        title="Gerenciar Reservas de Sala"
        description="Crie e visualize reservas recorrentes de salas para turmas."
        icon={ListChecks}
        actions={
          <Button asChild>
            <Link href="/reservations/new-recurring">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Reserva Recorrente
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Reservas Recorrentes ({enrichedReservations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {enrichedReservations.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <CalendarX2 className="mx-auto h-16 w-16 mb-6" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma reserva recorrente encontrada.</h3>
              <p className="mb-6">
                Crie uma nova reserva recorrente para uma turma e uma sala.
              </p>
              <Button variant="default" asChild>
                <Link href="/reservations/new-recurring">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Criar Primeira Reserva Recorrente
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propósito</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Dias de Aula da Turma</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedReservations.map((res: EnrichedReservation) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.purpose}</TableCell>
                    <TableCell>{res.classGroupName}</TableCell>
                    <TableCell>{res.classroomName}</TableCell>
                    <TableCell>
                      {res.classGroupDays && res.classGroupDays.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {res.classGroupDays.map(day => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {day.substring(0,3)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/D</span>
                      )}
                    </TableCell>
                    <TableCell>{res.startTime} - {res.endTime}</TableCell>
                    <TableCell>{res.formattedStartDate} - {res.formattedEndDate}</TableCell>
                    <TableCell className="text-right">
                      {/* Edit button can be added later */}
                      {/* <Button variant="ghost" size="icon" className="mr-2" asChild>
                        <Link href={`/reservations/edit-recurring/${res.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button> */}
                      <DeleteRecurringReservationButton reservationId={res.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
       <Card className="shadow-lg mt-8">
        <CardHeader>
          <CardTitle className="font-headline">Reservas Pontuais (Labs/Salas Especiais)</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="text-center text-muted-foreground py-12">
              <ListChecks className="mx-auto h-16 w-16 mb-6" />
              <h3 className="text-xl font-semibold mb-2">Funcionalidade em Breve</h3>
              <p className="mb-6">
                O gerenciamento de reservas pontuais (não recorrentes) para laboratórios e salas especiais estará disponível aqui em breve.
              </p>
            </div>
        </CardContent>
      </Card>
    </>
  );
}
