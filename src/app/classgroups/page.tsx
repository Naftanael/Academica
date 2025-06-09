
import Link from 'next/link';
import { PlusCircle, UsersRound, Edit, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getClassGroups, deleteClassGroup } from '@/lib/actions/classgroups';
import type { ClassGroup } from '@/types';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { toast } from '@/hooks/use-toast'; // Assuming useToast exists and works with server actions or client components

// Client component to handle delete with confirmation
function DeleteClassGroupButton({ classGroupId, className }: { classGroupId: string, className?: string }) {
  'use client'; // Required for event handlers and state

  const handleDelete = async () => {
    const result = await deleteClassGroup(classGroupId);
    if (result.success) {
      toast({
        title: "Sucesso!",
        description: result.message,
        variant: "default",
      });
    } else {
      toast({
        title: "Erro",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DeleteConfirmationDialog
      onConfirm={handleDelete}
      triggerButton={
        <Button variant="ghost" size="icon" className={className}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Excluir Turma</span>
        </Button>
      }
      dialogTitle="Excluir Turma?"
      dialogDescription="Esta ação não pode ser desfeita. Todos os dados da turma serão removidos."
    />
  );
}


export default async function ClassGroupsPage() {
  const classGroups = await getClassGroups();

  return (
    <>
      <PageHeader
        title="Turmas"
        description="Gerencie as turmas da sua instituição."
        icon={UsersRound}
        actions={
          <Button asChild>
            <Link href="/classgroups/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Turma
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Turmas ({classGroups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {classGroups.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <UsersRound className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma turma cadastrada ainda.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/classgroups/new">
                  Cadastrar primeira turma
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classGroups.map((cg: ClassGroup) => (
                  <TableRow key={cg.id}>
                    <TableCell className="font-medium">{cg.name}</TableCell>
                    <TableCell>{cg.shift}</TableCell>
                    <TableCell><Badge variant={cg.status === 'Em Andamento' ? 'default' : cg.status === 'Planejada' ? 'secondary' : 'outline'}>{cg.status}</Badge></TableCell>
                    <TableCell>{cg.year}</TableCell>
                    <TableCell className="text-right">
                       {/* Edit button can be added later: 
                       <Button variant="ghost" size="icon" asChild className="mr-2">
                        <Link href={`/classgroups/${cg.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar Turma</span>
                        </Link>
                      </Button>
                      */}
                      <DeleteClassGroupButton classGroupId={cg.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

