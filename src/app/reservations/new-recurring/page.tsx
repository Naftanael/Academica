
import Link from 'next/link';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NewRecurringReservationForm from '@/components/reservations/NewRecurringReservationForm';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';

export default async function NewRecurringReservationPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();

  return (
    <>
      <PageHeader
        title="Nova Reserva Recorrente"
        description="Preencha os dados para agendar uma reserva recorrente para uma turma."
        icon={CalendarPlus}
        actions={
          <Button variant="outline" asChild>
            <Link href="/reservations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista de Reservas
            </Link>
          </Button>
        }
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes da Reserva Recorrente</CardTitle>
        </CardHeader>
        <CardContent>
          <NewRecurringReservationForm classGroups={classGroups} classrooms={classrooms} />
        </CardContent>
      </Card>
    </>
  );
}
