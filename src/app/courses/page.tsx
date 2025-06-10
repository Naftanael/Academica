
import Link from 'next/link';
import { PlusCircle, BookOpen, Edit } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCourses } from '@/lib/actions/courses';
import type { Course } from '@/types';
import { DeleteCourseButton } from '@/components/courses/DeleteCourseButton';

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <>
      <PageHeader
        title="Disciplinas"
        description="Gerencie as disciplinas da sua instituição."
        icon={BookOpen}
        actions={
          <Button asChild>
            <Link href="/courses/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Disciplina
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Disciplinas ({courses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <BookOpen className="mx-auto h-12 w-12 mb-4" />
              <p>Nenhuma disciplina cadastrada ainda.</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/courses/new">
                  Cadastrar primeira disciplina
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Carga Horária (aulas)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course: Course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.name}</TableCell>
                    <TableCell>{course.workload}</TableCell>
                    <TableCell className="text-right">
                      {/* Edit button can be added later if needed
                      <Button variant="ghost" size="icon" asChild className="mr-2">
                        <Link href={`/courses/${course.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar Disciplina</span>
                        </Link>
                      </Button>
                      */}
                      <DeleteCourseButton courseId={course.id} />
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
