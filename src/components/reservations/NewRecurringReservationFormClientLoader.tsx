
'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { ClassGroup, Classroom } from '@/types';

// Dynamically import NewRecurringReservationForm
const NewRecurringReservationForm: ComponentType<{ classGroups: ClassGroup[]; classrooms: Classroom[] }> = dynamic(
  () => import('@/components/reservations/NewRecurringReservationForm'),
  { 
    loading: () => <p className="text-center py-4">Carregando formulário de reserva...</p>,
    ssr: false // This is now in a Client Component, which is allowed
  }
);

interface NewRecurringReservationFormClientLoaderProps {
  classGroups: ClassGroup[];
  classrooms: Classroom[];
}

export default function NewRecurringReservationFormClientLoader({ classGroups, classrooms }: NewRecurringReservationFormClientLoaderProps) {
  return <NewRecurringReservationForm classGroups={classGroups} classrooms={classrooms} />;
}
