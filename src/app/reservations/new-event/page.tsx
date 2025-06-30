
import Link from 'next/link';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClassrooms } from '@/lib/actions/classrooms';
import NewEventReservationForm from '@/components/reservations/NewEventReservationForm';
import type { Classroom } from '@/types';

export default async function NewEventReservationPage() {
  const classrooms: Classroom[] = await getClassrooms();

  return (
    <>
      <PageHeader
        title="Nova Reserva de Evento"
        description="Preencha os dados para agendar uma reserva pontual para uma sala."
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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Detalhes da Reserva de Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <NewEventReservationForm classrooms={classrooms} />
        </CardContent>
      </Card>
    </>
  );
}
