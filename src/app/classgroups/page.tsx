
import Link from 'next/link';
import { PlusCircle, UsersRound, GraduationCap } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { ClassGroup } from '@/types';
import { DeleteClassGroupButton } from '@/components/classgroups/DeleteClassGroupButton';
import { EditClassGroupButton } from '@/components/classgroups/EditClassGroupButton';


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
                  <TableHead>Dias de Aula</TableHead>
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
                    <TableCell>
                      {cg.classDays && cg.classDays.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cg.classDays.map(day => (
                            <Badge key={day} variant="secondary" className="text-xs">
                              {day.substring(0,3)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/D</span>
                      )}
                    </TableCell>
                    <TableCell><Badge variant={cg.status === 'Em Andamento' ? 'default' : cg.status === 'Planejada' ? 'secondary' : 'outline'}>{cg.status}</Badge></TableCell>
                    <TableCell>{cg.year}</TableCell>
                    <TableCell className="text-right">
                      <EditClassGroupButton classGroupId={cg.id} className="mr-2" />
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
