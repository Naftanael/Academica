
import Link from 'next/link';
import { Suspense } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ClassGroupsTable } from '@/components/classgroups/ClassGroupsTable'; 

export const dynamic = 'force-dynamic';

export default function ClassGroupsPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="Turmas"
                    description="Gerencie as turmas, atribua salas de aula e visualize os detalhes."
                />
                <Button asChild>
                    <Link href="/classgroups/new">Nova Turma</Link>
                </Button>
            </div>
            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ClassGroupsTable />
            </Suspense>
        </div>
    );
}
