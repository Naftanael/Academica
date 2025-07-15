// src/app/reservations/page.tsx
import Link from 'next/link';
import { Suspense } from 'react';
import { PlusCircle, ListChecks, CalendarPlus, CalendarClock } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import RecurringReservationsSection from './RecurringReservationsSection'; // We will create this
import EventReservationsSection from './EventReservationsSection'; // We will create this

/**
 * Loading skeleton for a reservations table card.
 */
function ReservationsLoadingSkeleton() {
  return <Skeleton className="h-64 w-full rounded-lg" />;
}

export default function ReservationsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Gerenciar Reservas de Sala"
        description="Crie e visualize reservas recorrentes para turmas e reservas pontuais para eventos."
        icon={ListChecks}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/reservations/new-recurring">
              <CalendarClock className="mr-2 h-4 w-4" />
              Nova Reserva Recorrente
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/reservations/new-event">
              <CalendarPlus className="mr-2 h-4 w-4" />
              Nova Reserva de Evento
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Suspense fallback={<ReservationsLoadingSkeleton />}>
        <RecurringReservationsSection />
      </Suspense>

      <Suspense fallback={<ReservationsLoadingSkeleton />}>
        <EventReservationsSection />
      </Suspense>
    </div>
  );
}
