
import { Suspense } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { CalendarDays, School } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getEventReservations } from '@/lib/actions/event_reservations';
import { getRecurringReservations } from '@/lib/actions/recurring_reservations';
import RoomAvailabilityDisplay from '@/components/room-availability/RoomAvailabilityDisplay';
import { TooltipProvider } from '@/components/ui/tooltip';

async function AvailabilityData() {
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();
  const eventReservations = await getEventReservations();
  const recurringReservations = await getRecurringReservations();

  if (classrooms.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <School className="mx-auto h-12 w-12 text-primary" />
            <p className="text-lg">Nenhuma sala de aula cadastrada.</p>
            <p className="text-sm mt-2">Cadastre salas para visualizar a disponibilidade.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <RoomAvailabilityDisplay 
      initialClassrooms={classrooms} 
      initialClassGroups={classGroups} 
      initialEventReservations={eventReservations}
      initialRecurringReservations={recurringReservations}
    />
  );
}

export default function RoomAvailabilityPage() {
  return (
    <TooltipProvider>
      <PageHeader
        title="Disponibilidade de Salas por Dia"
        description="Selecione uma data para visualizar o status de ocupação de todas as salas."
        icon={CalendarDays}
      />
      <Suspense fallback={
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
                <p className="text-lg font-medium">Carregando...</p>
                <p>A obter dados de disponibilidade.</p>
            </div>
          </CardContent>
        </Card>
      }>
        <AvailabilityData />
      </Suspense>
    </TooltipProvider>
  );
}
