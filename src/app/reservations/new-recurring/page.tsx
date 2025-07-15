// src/app/reservations/new-recurring/page.tsx
import NewRecurringReservationForm from "@/components/reservations/NewRecurringReservationForm";
import PageHeader from "@/components/shared/PageHeader";
import { getClassrooms } from "@/lib/actions/classrooms";
import { getClassGroups } from "@/lib/actions/classgroups";

/**
 * Page for creating a new recurring reservation.
 * Fetches required data (class groups and classrooms) on the server 
 * and passes it to the form component.
 */
export default async function NewRecurringReservationPage() {
  const classGroups = await getClassGroups();
  const allClassrooms = await getClassrooms();

  // Only allow reservations for classrooms that are not under maintenance
  const availableClassrooms = allClassrooms.filter(c => !c.isUnderMaintenance);
  
  // Filter class groups that are not yet "Concluída"
  const availableClassGroups = classGroups.filter(cg => cg.status !== 'Concluída');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Reserva Recorrente"
        description="Associe uma turma a uma sala de aula por um período determinado."
      />
      <NewRecurringReservationForm 
        classGroups={availableClassGroups} 
        classrooms={availableClassrooms} 
      />
    </div>
  );
}
