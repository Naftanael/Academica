
import Link from 'next/link';
import { PlusCircle, GraduationCap } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAppCursos } from '@/lib/actions/app_cursos';
import type { AppCurso } from '@/types';
import { DeleteAppCursoButton } from '@/components/app-cursos/DeleteAppCursoButton';

export default async function AppCursosPage() {
  const appCursos = await getAppCursos();

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Gerencie os cursos (programas de estudo) da sua instituição."
        icon={GraduationCap}
        actions={
          <Button asChild>
            <Link href="/app-cursos/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Curso
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Cursos ({appCursos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {appCursos.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <GraduationCap className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhum curso cadastrado ainda.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/app-cursos/new">
                  Cadastrar primeiro curso
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Curso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appCursos.map((curso: AppCurso) => (
                  <TableRow key={curso.id}>
                    <TableCell className="font-medium">{curso.name}</TableCell>
                    <TableCell className="text-right">
                      {/* Edit button can be added later if needed
                      <Button variant="ghost" size="icon" asChild className="mr-2">
                        <Link href={`/app-cursos/${curso.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar Curso</span>
                        </Link>
                      </Button>
                      */}
                      <DeleteAppCursoButton appCursoId={curso.id} />
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
