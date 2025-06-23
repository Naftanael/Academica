
import Link from 'next/link';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getRecurringReservations } from '@/lib/actions/recurring_reservations';
import NewRecurringReservationForm from '@/components/reservations/NewRecurringReservationForm';
import type { ClassGroup, Classroom, ClassroomRecurringReservation } from '@/types';


export default async function NewRecurringReservationPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();
  const allRecurringReservations = await getRecurringReservations();

  return (
    <>
      <PageHeader
        title="Nova Reserva Recorrente"
        description="Preencha os dados para agendar uma reserva recorrente para uma turma."
        icon={CalendarPlus}
        actions={
          <Button variant="outline" asChild className="hover:bg-accent hover:text-accent-foreground">
            <Link href="/reservations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista de Reservas
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl mx-auto shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Detalhes da Reserva Recorrente</CardTitle>
        </CardHeader>
        <CardContent>
          <NewRecurringReservationForm
            classGroups={classGroups}
            classrooms={classrooms}
            allRecurringReservations={allRecurringReservations}
          />
        </CardContent>
      </Card>
    </>
  );
}
