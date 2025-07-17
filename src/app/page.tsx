
import { Suspense } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    const currentDate = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground">
                {currentDate}
            </p>
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DashboardContent />
            </Suspense>
        </div>
    );
}
