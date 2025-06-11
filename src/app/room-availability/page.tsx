
import PageHeader from '@/components/shared/PageHeader';
import { CalendarDays, School } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import RoomAvailabilityDisplay from '@/components/room-availability/RoomAvailabilityDisplay';

export default async function RoomAvailabilityPage() {
  const classrooms = await getClassrooms();
  const classGroups = await getClassGroups();

  return (
    <>
      <PageHeader
        title="Disponibilidade de Salas"
        description="Selecione um intervalo de datas para visualizar a ocupação das salas de aula."
        icon={CalendarDays}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Filtro e Quadro de Ocupação Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          {classrooms.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <School className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma sala de aula cadastrada.</p>
              <p className="text-sm mt-2">Cadastre salas para visualizar a disponibilidade.</p>
            </div>
          ) : (
            <RoomAvailabilityDisplay initialClassrooms={classrooms} initialClassGroups={classGroups} />
          )}
           <p className="text-xs text-muted-foreground mt-6">
            Nota: Este quadro reflete a ocupação padrão com base nos dias de aula e turnos das turmas ativas no período selecionado. Reservas pontuais não estão incluídas.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
