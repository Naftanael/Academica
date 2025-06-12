
'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { ClassGroup, Classroom, ClassroomRecurringReservation } from '@/types'; // Added ClassroomRecurringReservation

// Dynamically import NewRecurringReservationForm
const NewRecurringReservationForm: ComponentType<{ 
  classGroups: ClassGroup[]; 
  classrooms: Classroom[];
  allRecurringReservations: ClassroomRecurringReservation[]; // Added
}> = dynamic(
  () => import('@/components/reservations/NewRecurringReservationForm'),
  { 
    loading: () => <p className="text-center py-4">Carregando formulário de reserva...</p>,
    ssr: false 
  }
);

interface NewRecurringReservationFormClientLoaderProps {
  classGroups: ClassGroup[];
  classrooms: Classroom[];
  allRecurringReservations: ClassroomRecurringReservation[]; // Added
}

export default function NewRecurringReservationFormClientLoader({ 
  classGroups, 
  classrooms,
  allRecurringReservations // Added
}: NewRecurringReservationFormClientLoaderProps) {
  return <NewRecurringReservationForm 
            classGroups={classGroups} 
            classrooms={classrooms} 
            allRecurringReservations={allRecurringReservations} // Added
          />;
}

