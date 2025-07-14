
import { Suspense } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { LayoutDashboard } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ExportTvDisplayButton from '@/components/dashboard/ExportTvDisplayButton';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg shadow-lg">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        ))}
      </div>
      <div className="mb-8">
        <Skeleton className="h-[350px] w-full" />
      </div>
      <div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <PageHeader
          title="Dashboard"
          description={`Bem-vindo(a) ao Painel Academica. Hoje é ${format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`}
          icon={LayoutDashboard}
        />
        <ExportTvDisplayButton />
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}
