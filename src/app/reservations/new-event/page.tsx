// src/app/reservations/new-event/page.tsx
import NewEventReservationForm from "@/components/reservations/NewEventReservationForm";
import PageHeader from "@/components/shared/PageHeader";
import { getClassrooms } from "@/lib/actions/classrooms";

/**
 * Page for creating a new event reservation.
 * Fetches the list of available classrooms on the server and passes it to the form component.
 */
export default async function NewEventReservationPage() {
  // Fetch classrooms that are not under maintenance to make them available in the form
  const allClassrooms = await getClassrooms();
  const availableClassrooms = allClassrooms.filter(c => !c.isUnderMaintenance);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Reserva de Evento"
        description="Reserve uma sala para um evento, reunião ou outra atividade pontual."
      />
      <NewEventReservationForm classrooms={availableClassrooms} />
    </div>
  );
}
