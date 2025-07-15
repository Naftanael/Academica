// src/app/classgroups/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ClassGroupsTable from '@/components/classgroups/ClassGroupsTable'; // Updated import

/**
 * Loading skeleton for the class groups table.
 */
function ClassGroupsLoading() {
  return (
    <div className="space-y-4">
      {/* A simple skeleton for the table card */}
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default function ClassGroupsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Turmas"
        description="Gerencie as turmas e seus horários."
      >
        <Button asChild>
          <Link href="/classgroups/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Turma
          </Link>
        </Button>
      </PageHeader>

      <Suspense fallback={<ClassGroupsLoading />}>
        {/* The ClassGroupsTable server component now handles its own data fetching */}
        <ClassGroupsTable />
      </Suspense>
    </div>
  );
}
