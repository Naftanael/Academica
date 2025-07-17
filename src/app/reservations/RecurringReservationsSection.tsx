
// src/app/reservations/RecurringReservationsSection.tsx
import Link from 'next/link';
import { PlusCircle, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { getRecurringReservations } from '@/lib/actions/recurring_reservations';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { ClassroomRecurringReservation, DayOfWeek } from '@/types';
import { format, parse, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DeleteRecurringReservationButton } from '@/components/reservations/DeleteRecurringReservationButton';

// Helper to safely format a date string (ISO or YYYY-MM-DD) to DD/MM/YY
function formatSimpleDate(dateString: string | null): string {
  if (!dateString) return 'Não def.'; // Handle null or empty strings safely
  
  // Try parsing as full ISO string first, then fallback to simple format
  const date = parseISO(dateString);
  if (isValid(date)) {
    return format(date, 'dd/MM/yy', { locale: ptBR });
  }

  // Fallback for older YYYY-MM-DD format if needed, though ISO is preferred
  const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
  if (isValid(parsedDate)) {
    return format(parsedDate, 'dd/MM/yy', { locale: ptBR });
  }

  return 'Inválida';
}


interface EnrichedRecurringReservation extends ClassroomRecurringReservation {
  classroomName: string;
  classGroupName: string;
  classGroupDays: DayOfWeek[];
  shift: string;
  formattedStartDate: string;
  formattedEndDate: string;
}

export default async function RecurringReservationsSection() {
  const recurringReservationsData = await getRecurringReservations();
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();

  const classroomMap = new Map(classrooms.map(c => [c.id, c.name]));
  const classGroupMap = new Map(classGroups.map(cg => [cg.id, { name: cg.name, classDays: cg.classDays, shift: cg.shift }]));

  const enrichedReservations: EnrichedRecurringReservation[] = recurringReservationsData.map(res => {
    const classGroupDetails = classGroupMap.get(res.classGroupId);
    return {
      ...res,
      classroomName: classroomMap.get(res.classroomId) || 'Sala desconhecida',
      classGroupName: classGroupDetails?.name || 'Turma desconhecida',
      classGroupDays: classGroupDetails?.classDays || [],
      shift: classGroupDetails?.shift || 'Turno Indefinido',
      formattedStartDate: formatSimpleDate(res.startDate),
      formattedEndDate: formatSimpleDate(res.endDate),
    };
  });

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-xl">Reservas Recorrentes ({enrichedReservations.length})</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reservations/new-recurring">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
            </Link>
          </Button>
        </div>
        <CardDescription>Reservas de salas que se repetem para turmas específicas.</CardDescription>
      </CardHeader>
      <CardContent>
        {enrichedReservations.length === 0 ? (
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
                  <TableHead>Propósito</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedReservations.map((res) => (
                  <TableRow key={res.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{res.purpose}</TableCell>
                    <TableCell>{res.classGroupName}</TableCell>
                    <TableCell>{res.classroomName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {res.classGroupDays.map(day => (
                          <Badge key={day} variant="secondary">{day.substring(0,3)}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{res.shift}</TableCell>
                    <TableCell>{res.formattedStartDate} - {res.formattedEndDate}</TableCell>
                    <TableCell className="text-right">
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
  );
}
