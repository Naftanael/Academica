
import Link from 'next/link';
import { PlusCircle, ListChecks, CalendarPlus, Edit, Trash2, CalendarClock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getRecurringReservations } from '@/lib/actions/recurring_reservations';
import { getEventReservations } from '@/lib/actions/event_reservations';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { ClassroomRecurringReservation, EventReservation, Classroom, ClassGroup, DayOfWeek } from '@/types';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteRecurringReservationButton } from '@/components/reservations/DeleteRecurringReservationButton';
import { DeleteEventReservationButton } from '@/components/reservations/DeleteEventReservationButton';

interface EnrichedRecurringReservation extends ClassroomRecurringReservation {
  classroomName: string;
  classGroupName: string;
  classGroupDays: DayOfWeek[];
  formattedStartDate: string;
  formattedEndDate: string;
}

interface EnrichedEventReservation extends EventReservation {
  classroomName: string;
  formattedDate: string;
  formattedStartTime: string;
  formattedEndTime: string;
}

export default async function ReservationsPage() {
  const recurringReservationsData = await getRecurringReservations();
  const eventReservationsData = await getEventReservations();
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
  const classGroupMap = new Map(classGroups.map(cg => [cg.id, { name: cg.name, classDays: cg.classDays }]));

  const enrichedRecurringReservations: EnrichedRecurringReservation[] = recurringReservationsData.map(res => {
    const classGroupDetails = classGroupMap.get(res.classGroupId);
    let parsedStartDate: Date | null = null;
    let parsedEndDate: Date | null = null;
    let formattedStartDate = 'Data Inválida';
    let formattedEndDate = 'Data Inválida';

    try {
      if (typeof res.startDate === 'string') {
        const tempDate = parseISO(res.startDate);
        if (isValid(tempDate)) {
          parsedStartDate = tempDate;
          formattedStartDate = format(parsedStartDate, "dd/MM/yy", { locale: ptBR });
        }
      }
    } catch (e) {
      console.warn(`Reservations: Could not parse startDate "${res.startDate}" for recurring reservation ${res.id}.`, e);
    }
    
    try {
      if (typeof res.endDate === 'string') {
        const tempDate = parseISO(res.endDate);
        if (isValid(tempDate)) {
          parsedEndDate = tempDate;
          formattedEndDate = format(parsedEndDate, "dd/MM/yy", { locale: ptBR });
        }
      }
    } catch (e) {
      console.warn(`Reservations: Could not parse endDate "${res.endDate}" for recurring reservation ${res.id}.`, e);
    }

    return {
      ...res,
      classroomName: classroomMap.get(res.classroomId) || 'Sala desconhecida',
      classGroupName: classGroupDetails?.name || 'Turma desconhecida',
      classGroupDays: classGroupDetails?.classDays || [],
      formattedStartDate: formattedStartDate,
      formattedEndDate: formattedEndDate,
    };
  });

  const enrichedEventReservations: EnrichedEventReservation[] = eventReservationsData.map(event => {
    let parsedDate: Date | null = null;
    let formattedDate = 'Data Inválida';

    try {
      if (typeof event.date === 'string') {
        const tempDate = parseISO(event.date);
        if (isValid(tempDate)) {
          parsedDate = tempDate;
          formattedDate = format(parsedDate, "dd/MM/yyyy", { locale: ptBR });
        }
      }
    } catch (e) {
      console.warn(`Reservations: Could not parse date "${event.date}" for event reservation ${event.id}.`, e);
    }
    
    return {
      ...event,
      classroomName: classroomMap.get(event.classroomId) || 'Sala desconhecida',
      formattedDate: formattedDate,
      formattedStartTime: event.startTime, // Already HH:mm
      formattedEndTime: event.endTime, // Already HH:mm
    };
  });

  return (
    <>
      <PageHeader
        title="Gerenciar Reservas de Sala"
        description="Crie e visualize reservas recorrentes para turmas e reservas pontuais para eventos."
        icon={ListChecks}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/reservations/new-recurring">
                <CalendarClock className="mr-2 h-4 w-4" />
                Nova Reserva Recorrente
              </Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/reservations/new-event">
                <CalendarPlus className="mr-2 h-4 w-4" />
                Nova Reserva de Evento
              </Link>
            </Button>
          </div>
        }
      />
      <div className="space-y-8">
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="font-headline text-xl">Reservas Recorrentes ({enrichedRecurringReservations.length})</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reservations/new-recurring">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Link>
              </Button>
            </div>
            <CardDescription>Reservas de salas que se repetem para turmas específicas.</CardDescription>
          </CardHeader>
          <CardContent>
            {enrichedRecurringReservations.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <CalendarClock className="mx-auto h-16 w-16 mb-6 text-primary" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma reserva recorrente encontrada.</h3>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/reservations/new-recurring">
                    Criar Primeira Reserva Recorrente
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Propósito</TableHead>
                      <TableHead className="font-semibold">Turma</TableHead>
                      <TableHead className="font-semibold">Sala</TableHead>
                      <TableHead className="font-semibold">Dias da Turma</TableHead>
                      <TableHead className="font-semibold">Turno</TableHead>
                      <TableHead className="font-semibold">Período</TableHead>
                      <TableHead className="text-right font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedRecurringReservations.map((res: EnrichedRecurringReservation) => (
                      <TableRow key={res.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{res.purpose}</TableCell>
                        <TableCell>{res.classGroupName}</TableCell>
                        <TableCell>{res.classroomName}</TableCell>
                        <TableCell>
                          {res.classGroupDays && res.classGroupDays.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {res.classGroupDays.map(day => (
                                <Badge key={day} variant="secondary" className="text-xs font-medium">
                                  {day.substring(0,3)}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">N/D</span>
                          )}
                        </TableCell>
                        <TableCell>{res.shift}</TableCell>
                        <TableCell>{res.formattedStartDate} - {res.formattedEndDate}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <DeleteRecurringReservationButton reservationId={res.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-lg">
          <CardHeader>
             <div className="flex justify-between items-center">
              <CardTitle className="font-headline text-xl">Reservas de Eventos (Pontuais) ({enrichedEventReservations.length})</CardTitle>
               <Button variant="ghost" size="sm" asChild>
                <Link href="/reservations/new-event">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Link>
              </Button>
            </div>
            <CardDescription>Reservas únicas para eventos, reuniões ou atividades específicas.</CardDescription>
          </CardHeader>
          <CardContent>
            {enrichedEventReservations.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <CalendarPlus className="mx-auto h-16 w-16 mb-6 text-primary" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma reserva de evento encontrada.</h3>
                 <Button variant="link" asChild className="mt-2">
                  <Link href="/reservations/new-event">
                    Criar Primeira Reserva de Evento
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Título do Evento</TableHead>
                      <TableHead className="font-semibold">Sala</TableHead>
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Horário</TableHead>
                      <TableHead className="font-semibold">Reservado Por</TableHead>
                      <TableHead className="font-semibold">Detalhes</TableHead>
                      <TableHead className="text-right font-semibold">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedEventReservations.map((event: EnrichedEventReservation) => (
                      <TableRow key={event.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium text-foreground">{event.title}</TableCell>
                        <TableCell>{event.classroomName}</TableCell>
                        <TableCell>{event.formattedDate}</TableCell>
                        <TableCell>{event.formattedStartTime} - {event.formattedEndTime}</TableCell>
                        <TableCell>{event.reservedBy}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={event.details}>{event.details || '-'}</TableCell>
                        <TableCell className="text-right space-x-1">
                           <DeleteEventReservationButton reservationId={event.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
