
'use client';

import { useState, useMemo, ChangeEvent, FormEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ClassGroup, Classroom } from '@/types';

interface StudentSearchViewProps {
  classGroups: (ClassGroup & { classroomName?: string })[];
  classrooms: Classroom[];
}

interface Student {
  id: string;
  name: string;
  classGroups: (ClassGroup & { classroomName?: string })[];
}

// Mock student data - in a real application, this would come from an API
const MOCK_STUDENTS: Student[] = [
  { id: '1', name: 'Alice Silva', classGroups: [] },
  { id: '2', name: 'Bruno Costa', classGroups: [] },
  { id: '3', name: 'Carla Dias', classGroups: [] },
  { id: '4', name: 'Daniel Souza', classGroups: [] },
  { id: '5', name: 'Beatriz Guimarães', classGroups: [] },
  { id: '6', name: 'Felipe Antunes', classGroups: [] },
  { id: '7', name: 'Gabriel Monteiro', classGroups: [] },
  { id: '8', name: 'Heloísa Nogueira', classGroups: [] },
  { id: '9', name: 'Igor Nascimento', classGroups: [] },
  { id: '10', name: 'Juliana Castro', classGroups: [] },
  { id: '11', name: 'Kátia Pereira', classGroups: [] },
  { id: '12', name: 'Leandro Cardoso', classGroups: [] },
  { id: '13', name: 'Márcia Barbosa', classGroups: [] },
  { id: '14', name: 'Nícolas Azevedo', classGroups: [] },
  { id: '15', name: 'Otávio Martins', classGroups: [] },
];

function assignClassGroupsToStudents(
  students: Student[],
  classGroups: (ClassGroup & { classroomName?: string })[]
): Student[] {
  return students.map((student, index) => ({
    ...student,
    // Simple mock assignment: each student gets 1 or 2 class groups
    classGroups:
      index % 3 === 0
        ? classGroups.slice(index % classGroups.length, (index % classGroups.length) + 1)
        : classGroups.slice(index % classGroups.length, (index % classGroups.length) + 2),
  }));
}

export default function StudentSearchView({
  classGroups,
  classrooms,
}: StudentSearchViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searched, setSearched] = useState(false);

  const studentsWithClassGroups = useMemo(
    () => assignClassGroupsToStudents(MOCK_STUDENTS, classGroups),
    [classGroups]
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearched(true);
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const results = studentsWithClassGroups.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Busca por Aluno</CardTitle>
          <CardDescription>
            Digite o nome do aluno para ver as turmas em que ele está
            matriculado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="search"
              placeholder="Nome do aluno..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Button type="submit">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Busca</CardTitle>
            <CardDescription>
              {searchResults.length} aluno(s) encontrado(s).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {searchResults.map(student => (
                  <AccordionItem key={student.id} value={`student-${student.id}`}>
                    <AccordionTrigger>{student.name}</AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2">
                        <h4 className="font-semibold">Turmas:</h4>
                        {student.classGroups && student.classGroups.length > 0 ? (
                          student.classGroups.map(cg => (
                            <Button
                              key={cg.id}
                              variant="outline"
                              className="h-auto justify-start text-left"
                            >
                              <div className="flex flex-col">
                                <span className="font-semibold">{cg.name}</span>
                                <span className="text-sm font-normal">
                                  {cg.shift}
                                </span>
                              </div>
                            </Button>
                          ))
                        ) : (
                          <p>Nenhuma turma encontrada.</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p>Nenhum resultado para &quot;{searchTerm}&quot;.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
