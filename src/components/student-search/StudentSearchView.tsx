'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Classroom, ClassGroup } from '@/types';
import { Search, DoorOpen, AlertTriangle, Wrench } from 'lucide-react';

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
    return allClassGroups
      .filter(cg => cg.name === selectedCourseName)
      .sort((a, b) => a.shift.localeCompare(b.shift)); // Sort by shift for better usability
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
    <Card className="shadow-lg rounded-lg w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline text-xl">Consulta Rápida de Sala</CardTitle>
            <CardDescription>Encontre sua sala em dois passos.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {/* Step 1: Course Selection */}
        <div className="space-y-2">
          <Label htmlFor="course-select" className="text-sm font-semibold text-muted-foreground">
            1. Selecione o Curso
          </Label>
          <Select onValueChange={handleCourseChange} value={selectedCourseName}>
            <SelectTrigger id="course-select" className="w-full text-base py-5">
              <SelectValue placeholder="Toque para escolher seu curso..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueCourseNames.map(name => (
                <SelectItem key={name} value={name} className="text-base py-2">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step 2: Class Selection (appears after step 1) */}
        {selectedCourseName && (
          <div className="space-y-3 animate-in fade-in-50 duration-500">
            <Label className="text-sm font-semibold text-muted-foreground">
              2. Selecione sua Turma e Turno
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {availableGroupsForCourse.length > 0 ? (
                availableGroupsForCourse.map(cg => (
                  <Button
                    key={cg.id}
                    variant={selectedClassGroupId === cg.id ? "default" : "outline"}
                    className="w-full justify-start h-auto py-3 text-left"
                    onClick={() => setSelectedClassGroupId(cg.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold">{cg.name} - {cg.year}</span>
                      <span className="text-sm font-normal">{cg.shift}</span>
                    </div>
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma turma encontrada para este curso.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Result Display */}
      {searchResult && (
        <CardFooter className="bg-primary/5 dark:bg-primary/10 p-6 rounded-b-lg mt-4">
          <div className="w-full animate-in fade-in-50 duration-500">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-primary/10 p-2 rounded-lg">
                <DoorOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Sua Sala</h3>
            </div>
            
            {searchResult.classroom ? (
              <div className="bg-background p-4 rounded-lg shadow-sm border border-border">
                <p className="text-sm text-muted-foreground mb-1">{searchResult.classGroup.name} - {searchResult.classGroup.shift}</p>
                <p className="text-4xl font-extrabold text-primary tracking-tight">{searchResult.classroom.name}</p>
                 {searchResult.classroom.isUnderMaintenance && (
                   <Badge variant="destructive" className="mt-2 bg-amber-600 text-white">
                      <Wrench className="mr-1.5 h-3 w-3" />
                      Sala em Manutenção
                   </Badge>
                )}
              </div>
            ) : (
              <div className="bg-destructive/10 p-4 rounded-lg text-center border border-destructive/20">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-2xl font-bold text-destructive">Não Atribuída</p>
                <p className="text-sm text-destructive/80 mt-1">Por favor, consulte a secretaria.</p>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}