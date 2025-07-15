// src/app/reservations/EventReservationsSection.tsx
import Link from 'next/link';
import { PlusCircle, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { getEventReservations } from '@/lib/actions/event_reservations';
import { getClassrooms } from '@/lib/actions/classrooms';
import type { EventReservation } from '@/types';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteEventReservationButton } from '@/components/reservations/DeleteEventReservationButton';

// Helper to safely format YYYY-MM-DD string to DD/MM/YY
function formatSimpleDate(dateString: string): string {
  if (!dateString || typeof dateString !== 'string') return 'Data Inválida';
  try {
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      return format(parsedDate, 'dd/MM/yy', { locale: ptBR });
    }
  } catch {
    // Fallback for unexpected formats
  }
  return 'Data Inválida';
}

interface EnrichedEventReservation extends EventReservation {
  classroomName: string;
  formattedDate: string;
}

export default async function EventReservationsSection() {
  const eventReservationsData = await getEventReservations();
  const classrooms = await getClassrooms();

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));

  const enrichedReservations: EnrichedEventReservation[] = eventReservationsData.map(event => ({
    ...event,
    classroomName: classroomMap.get(event.classroomId) || 'Sala desconhecida',
    formattedDate: formatSimpleDate(event.date),
  }));

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
         <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-xl">Reservas de Eventos ({enrichedReservations.length})</CardTitle>
           <Button variant="ghost" size="sm" asChild>
            <Link href="/reservations/new-event">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
            </Link>
          </Button>
        </div>
        <CardDescription>Reservas únicas para eventos, reuniões ou atividades específicas.</CardDescription>
      </CardHeader>
      <CardContent>
        {enrichedReservations.length === 0 ? (
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
                  <TableHead>Título</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedReservations.map((event) => (
                  <TableRow key={event.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.classroomName}</TableCell>
                    <TableCell>{event.formattedDate}</TableCell>
                    <TableCell>{event.startTime} - {event.endTime}</TableCell>
                    <TableCell>{event.reservedBy}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground" title={event.details}>{event.details || '–'}</TableCell>
                    <TableCell className="text-right">
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
  );
}
