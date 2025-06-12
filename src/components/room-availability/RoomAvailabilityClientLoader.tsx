
'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import type { Classroom, ClassGroup } from '@/types';

// Dynamically import RoomAvailabilityDisplay
const RoomAvailabilityDisplay: ComponentType<{ initialClassrooms: Classroom[]; initialClassGroups: ClassGroup[] }> = dynamic(
  () => import('@/components/room-availability/RoomAvailabilityDisplay'),
  { 
    loading: () => <p className="text-center py-4">Carregando quadro de disponibilidade...</p>,
    ssr: false // This is now in a Client Component, which is allowed
  }
);

interface RoomAvailabilityClientLoaderProps {
  initialClassrooms: Classroom[];
  initialClassGroups: ClassGroup[];
}

export default function RoomAvailabilityClientLoader({ initialClassrooms, initialClassGroups }: RoomAvailabilityClientLoaderProps) {
  return <RoomAvailabilityDisplay initialClassrooms={initialClassrooms} initialClassGroups={initialClassGroups} />;
}
