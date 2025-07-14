
import PageHeader from '@/components/shared/PageHeader';
import { CalendarDays, School } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getEventReservations } from '@/lib/actions/event_reservations';
import { getRecurringReservations } from '@/lib/actions/recurring_reservations';
import RoomAvailabilityDisplay from '@/components/room-availability/RoomAvailabilityDisplay';
import { TooltipProvider } from '@/components/ui/tooltip';

export default async function RoomAvailabilityPage() {
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();
  const eventReservations = await getEventReservations();
  const recurringReservations = await getRecurringReservations();

  return (
    <TooltipProvider>
      <PageHeader
        title="Disponibilidade de Salas por Dia"
        description="Selecione uma data para visualizar o status de ocupação de todas as salas."
        icon={CalendarDays}
      />
      
      {classrooms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <School className="mx-auto h-12 w-12 mb-4 text-primary" />
              <p className="text-lg">Nenhuma sala de aula cadastrada.</p>
              <p className="text-sm mt-2">Cadastre salas para visualizar a disponibilidade.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <RoomAvailabilityDisplay 
          initialClassrooms={classrooms} 
          initialClassGroups={classGroups} 
          initialEventReservations={eventReservations}
          initialRecurringReservations={recurringReservations}
        />
      )}
    </TooltipProvider>
  );
}
