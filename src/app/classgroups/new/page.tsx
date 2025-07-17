
import { NewClassGroupView } from '@/components/classgroups/NewClassGroupView';
import { getClassrooms } from '@/lib/actions/classrooms';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * Page for creating a new class group.
 * It fetches the list of available classrooms on the server to pass to the form.
 */
export default async function NewClassGroupPage() {
    const classrooms = await getClassrooms();

    return (
        <div className="space-y-6">
             <PageHeader
                title="Nova Turma"
                description="Preencha o formulário para criar uma nova turma."
                actions={
                    <Button asChild variant="outline">
                        <Link href="/classgroups">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                }
            />
            {/* The actual UI is within the client component, now receiving the classroom data */}
            <NewClassGroupView classrooms={classrooms} />
        </div>
    );
}
