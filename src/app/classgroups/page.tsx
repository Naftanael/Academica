
import Link from 'next/link';
import { PlusCircle, UsersRound, GraduationCap } from 'lucide-react'; // Changed BookOpen to GraduationCap
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getAppCursos } from '@/lib/actions/app_cursos'; // Changed from getCourses to getAppCursos
import type { ClassGroup, AppCurso } from '@/types'; // Changed Course to AppCurso
import { DeleteClassGroupButton } from '@/components/classgroups/DeleteClassGroupButton';
import { EditClassGroupButton } from '@/components/classgroups/EditClassGroupButton';


export default async function ClassGroupsPage() {
  const classGroups = await getClassGroups();
  const appCursos = await getAppCursos(); // Changed from courses and getCourses

  const appCursoMap = new Map(appCursos.map((ac: AppCurso) => [ac.id, ac.name])); // Changed courseMap to appCursoMap, Course to AppCurso

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
                  <TableHead>Curso (Programa)</TableHead>
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
                    <TableCell>
                      {cg.appCursoId ? ( // Changed from courseId to appCursoId
                        <Link href={`/app-cursos`} className="hover:underline flex items-center text-sm">
                           <GraduationCap className="mr-1 h-3 w-3" /> {/* Changed BookOpen to GraduationCap */}
                          {appCursoMap.get(cg.appCursoId) || 'Curso (Programa) não encontrado'}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/D</span>
                      )}
                    </TableCell>
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
