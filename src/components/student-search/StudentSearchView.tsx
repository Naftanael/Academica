'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Classroom, ClassGroup } from '@/types';
import { School, Users, Calendar, Clock, DoorOpen, AlertTriangle } from 'lucide-react';

interface StudentSearchViewProps {
  allClassrooms: Classroom[];
  allClassGroups: ClassGroup[];
}

interface SearchResult {
  classGroup: ClassGroup;
  classroom: Classroom | null;
}

export default function StudentSearchView({ allClassrooms, allClassGroups }: StudentSearchViewProps) {
  const [selectedCourseName, setSelectedCourseName] = React.useState<string | undefined>(undefined);
  const [selectedClassGroupId, setSelectedClassGroupId] = React.useState<string | undefined>(undefined);

  const uniqueCourseNames = React.useMemo(() => {
    const names = new Set(allClassGroups.map(cg => cg.name));
    return Array.from(names).sort();
  }, [allClassGroups]);

  const availableGroupsForCourse = React.useMemo(() => {
    if (!selectedCourseName) return [];
    return allClassGroups.filter(cg => cg.name === selectedCourseName);
  }, [selectedCourseName, allClassGroups]);

  const searchResult = React.useMemo((): SearchResult | null => {
    if (!selectedClassGroupId) return null;

    const classGroup = allClassGroups.find(cg => cg.id === selectedClassGroupId);
    if (!classGroup) return null;

    const classroom = classGroup.assignedClassroomId
      ? allClassrooms.find(cr => cr.id === classGroup.assignedClassroomId) ?? null
      : null;

    return { classGroup, classroom };
  }, [selectedClassGroupId, allClassGroups, allClassrooms]);

  const handleCourseChange = (courseName: string) => {
    setSelectedCourseName(courseName);
    setSelectedClassGroupId(undefined); // Reset turma selection when course changes
  };

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Encontre sua Turma</CardTitle>
        <CardDescription>Selecione seu curso e depois sua turma para ver a sala.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="course-select" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            1. Escolha o Curso
          </Label>
          <Select onValueChange={handleCourseChange} value={selectedCourseName}>
            <SelectTrigger id="course-select" className="w-full">
              <SelectValue placeholder="Selecione o nome do seu curso" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCourseNames.map(name => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCourseName && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <Label htmlFor="classgroup-select" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              2. Escolha a Turma
            </Label>
            <Select onValueChange={setSelectedClassGroupId} value={selectedClassGroupId}>
              <SelectTrigger id="classgroup-select" className="w-full">
                <SelectValue placeholder="Selecione sua turma e turno" />
              </SelectTrigger>
              <SelectContent>
                {availableGroupsForCourse.map(cg => (
                  <SelectItem key={cg.id} value={cg.id}>
                    {cg.name} - {cg.shift} ({cg.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
      {searchResult && (
        <CardFooter className="bg-muted/50 dark:bg-muted/20 p-6 rounded-b-lg animate-in fade-in duration-500">
            <div className="w-full">
                <h3 className="text-lg font-semibold text-foreground mb-4">Resultado da Busca</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary"/>
                        <span className="font-medium">Turma:</span>
                        <span>{searchResult.classGroup.name}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary"/>
                        <span className="font-medium">Turno:</span>
                        <span>{searchResult.classGroup.shift}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary"/>
                        <span className="font-medium">Ano:</span>
                        <span>{searchResult.classGroup.year}</span>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                    {searchResult.classroom ? (
                        <div className="flex items-center gap-3">
                            <DoorOpen className="h-10 w-10 text-accent flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">Sua sala é:</p>
                                <p className="text-2xl font-bold text-foreground">{searchResult.classroom.name}</p>
                            </div>
                        </div>
                    ) : (
                         <div className="flex items-center gap-3">
                            <AlertTriangle className="h-10 w-10 text-destructive flex-shrink-0" />
                            <div>
                                <p className="text-sm text-muted-foreground">Sala de aula:</p>
                                <p className="text-2xl font-bold text-destructive">Não Atribuída</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
