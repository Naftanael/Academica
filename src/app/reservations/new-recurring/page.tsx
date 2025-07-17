
import NewRecurringReservationForm from '@/components/reservations/NewRecurringReservationForm';
import PageHeader from '@/components/shared/PageHeader';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';

export default async function NewRecurringReservationPage() {
    // Fetch data for the form
    const [classGroups, classrooms] = await Promise.all([
        getClassGroups(),
        getClassrooms()
    ]);

    // No filtering needed anymore
    const availableClassGroups = classGroups;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Nova Reserva Recorrente"
                description="Preencha o formulário para criar uma nova reserva recorrente de sala."
            />
            <NewRecurringReservationForm 
                classGroups={availableClassGroups} 
                classrooms={classrooms} 
            />
        </div>
    );
}
