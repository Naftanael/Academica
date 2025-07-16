
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/shared/PageHeader';
import { UsersRound, ArrowLeft, Home, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NewClassGroupForm from '@/components/classgroups/NewClassGroupForm';
import { ChangeClassroomDialog } from '@/components/classgroups/ChangeClassroomDialog';
import type { Classroom, ClassGroup } from '@/types';
import { getClassrooms } from '@/lib/actions/classrooms';
import { changeClassroom } from '@/lib/actions/classgroups';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function NewClassGroupView() {
  const [classrooms, setClassrooms] = React.useState<Classroom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedClassroom, setSelectedClassroom] = React.useState<Classroom | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchClassrooms() {
      try {
        setLoading(true);
        const fetchedClassrooms = await getClassrooms();
        setClassrooms(fetchedClassrooms);
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClassrooms();
  }, []);

  const handleClassGroupCreated = async () => {
    toast({
      title: "Turma Criada com Sucesso!",
      description: `A nova turma foi criada.`,
    });
    router.push(`/classgroups`);
  };
  
  // Dummy ClassGroup to satisfy the ChangeClassroomDialog component
  const dummyClassGroup: ClassGroup = {
    id: 'temp-id',
    name: 'Nova Turma',
    assignedClassroomId: selectedClassroom?.id || undefined,
    // Add other required fields with default values
    shift: 'Manhã',
    year: new Date().getFullYear(),
    status: 'Planejada',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    classDays: [],
    notes: '',
  };

  return (
    <>
      <PageHeader
        title="Criar Nova Turma"
        description="Preencha os dados para criar uma nova turma e, opcionalmente, atribua uma sala."
        icon={UsersRound}
        actions={
          <Button
            variant="outline"
            asChild
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <Link href="/classgroups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Lista
            </Link>
          </Button>
        }
      />
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="md:col-span-2">
          <Card className="shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Dados da Nova Turma</CardTitle>
            </CardHeader>
            <CardContent>
              <NewClassGroupForm onClassGroupCreated={handleClassGroupCreated} />
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1 space-y-6">
           <Card className="shadow-lg rounded-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-xl">Atribuir Sala</CardTitle>
                    <CardDescription>
                        Opcional: Selecione uma sala para esta turma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : (
                        <div className="space-y-4 text-center">
                            <div className='p-4 bg-muted rounded-lg'>
                                {selectedClassroom ? (
                                    <>
                                        <p className="font-semibold text-lg">{selectedClassroom.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Capacidade: {selectedClassroom.capacity ?? 'N/A'} alunos
                                        </p>
                                        {selectedClassroom.isUnderMaintenance && (
                                            <div className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                <Wrench className="mr-2 h-3 w-3" /> Em Manutenção
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-muted-foreground">Nenhuma sala selecionada</p>
                                )}
                            </div>
                             <ChangeClassroomDialog 
                                classGroup={dummyClassGroup} 
                                availableClassrooms={classrooms}
                                onClassroomSelected={(classroomId) => {
                                    const classroom = classrooms.find(c => c.id === classroomId);
                                    setSelectedClassroom(classroom || null);
                                }}
                                triggerButton={
                                    <Button variant="default" className="w-full">
                                        <Home className="mr-2 h-4 w-4" />
                                        {selectedClassroom ? 'Trocar Sala' : 'Selecionar Sala'}
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
