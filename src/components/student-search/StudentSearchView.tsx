
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Classroom, ClassGroup } from '@/types';
import { Search, DoorOpen, AlertTriangle, Wrench, Pill, ScanLine, Stethoscope, Briefcase, BookOpen, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface StudentSearchViewProps {
  allClassrooms: Classroom[];
  allClassGroups: ClassGroup[];
}

interface SearchResult {
  classGroup: ClassGroup;
  classroom: Classroom | null;
}

interface CourseCategory {
  name: string;
  prefix: string;
  icon: LucideIcon;
}

const courseCategories: CourseCategory[] = [
  { name: 'Téc. em Farmácia', prefix: 'FMC', icon: Pill },
  { name: 'Téc. em Radiologia', prefix: 'RAD', icon: ScanLine },
  { name: 'Téc. em Enfermagem', prefix: 'ENF', icon: Stethoscope },
  { name: 'Administração', prefix: 'ADM', icon: Briefcase },
];
const otherCoursesCategory: CourseCategory = { name: 'Outros Cursos', prefix: 'OTHERS', icon: BookOpen };

const getCourseCategory = (className: string): CourseCategory | undefined => {
  return courseCategories.find(cat => className.toUpperCase().startsWith(cat.prefix));
};

const getCategorizedGroups = (groups: ClassGroup[]): Map<string, ClassGroup[]> => {
  const categorized = new Map<string, ClassGroup[]>();
  const others: ClassGroup[] = [];

  // Initialize map for all main categories
  courseCategories.forEach(cat => categorized.set(cat.name, []));

  groups.forEach(group => {
    const category = getCourseCategory(group.name);
    if (category) {
      categorized.get(category.name)?.push(group);
    } else {
      others.push(group);
    }
  });

  if (others.length > 0) {
    categorized.set(otherCoursesCategory.name, others);
  }

  // Remove empty categories
  for (const [key, value] of categorized.entries()) {
    if (value.length === 0) {
      categorized.delete(key);
    }
  }

  return categorized;
};


export default function StudentSearchView({ allClassrooms, allClassGroups }: StudentSearchViewProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<CourseCategory | undefined>(undefined);
  const [selectedClassGroupId, setSelectedClassGroupId] = React.useState<string | undefined>(undefined);

  const categorizedClassGroups = React.useMemo(() => getCategorizedGroups(allClassGroups), [allClassGroups]);
  
  const categoryOrder = [...courseCategories.map(c => c.name), otherCoursesCategory.name];
  const availableCategories = Array.from(categorizedClassGroups.keys()).sort((a,b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

  const availableGroupsForCategory = React.useMemo(() => {
    if (!selectedCategory) return [];
    return (categorizedClassGroups.get(selectedCategory.name) || [])
      .sort((a, b) => {
        if (a.name !== b.name) return a.name.localeCompare(b.name);
        return a.shift.localeCompare(b.shift);
      });
  }, [selectedCategory, categorizedClassGroups]);

  const searchResult = React.useMemo((): SearchResult | null => {
    if (!selectedClassGroupId) return null;

    const classGroup = allClassGroups.find(cg => cg.id === selectedClassGroupId);
    if (!classGroup) return null;

    const classroom = classGroup.assignedClassroomId
      ? allClassrooms.find(cr => cr.id === classGroup.assignedClassroomId) ?? null
      : null;

    return { classGroup, classroom };
  }, [selectedClassGroupId, allClassGroups, allClassrooms]);

  const handleCategorySelect = (categoryName: string) => {
    const category = [...courseCategories, otherCoursesCategory].find(c => c.name === categoryName);
    setSelectedCategory(category);
    setSelectedClassGroupId(undefined);
  };
  
  const handleReset = () => {
    setSelectedCategory(undefined);
    setSelectedClassGroupId(undefined);
  }

  return (
    <Card className="shadow-lg rounded-lg w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline text-xl">Consulta Rápida de Sala</CardTitle>
            <CardDescription>Encontre sua sala de aula em poucos passos.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {/* Step 1: Course Category Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-muted-foreground">
            1. Selecione a área do seu curso
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
             {availableCategories.map(catName => {
                const category = [...courseCategories, otherCoursesCategory].find(c => c.name === catName)!;
                return (
                    <Button
                        key={catName}
                        variant={selectedCategory?.name === catName ? "default" : "outline"}
                        className="h-auto p-4 flex flex-col items-center justify-center gap-2 text-center"
                        onClick={() => handleCategorySelect(catName)}
                    >
                        <category.icon className="h-7 w-7 mb-1 text-primary"/>
                        <span className="font-semibold text-sm whitespace-normal leading-tight">{catName}</span>
                    </Button>
                )
             })}
          </div>
        </div>

        {/* Step 2: Class Selection (appears after step 1) */}
        {selectedCategory && (
          <div className="space-y-3 animate-in fade-in-50 duration-500">
            <Label className="text-sm font-semibold text-muted-foreground">
              2. Selecione sua Turma e Turno
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {availableGroupsForCategory.length > 0 ? (
                availableGroupsForCategory.map(cg => (
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
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma turma encontrada para esta categoria.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Result Display */}
      {searchResult ? (
        <CardFooter className="bg-primary/5 dark:bg-primary/10 p-6 rounded-b-lg mt-4 flex flex-col items-start gap-4">
          <div className="w-full animate-in fade-in-50 duration-500">
             <div className="flex items-center gap-3 mb-4">
               <div className="bg-primary/10 p-2 rounded-lg">
                <DoorOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Sua Sala</h3>
            </div>
            
            {searchResult.classroom ? (
              <div className="bg-background p-4 rounded-lg shadow-sm border border-border w-full">
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
              <div className="bg-destructive/10 p-4 rounded-lg text-center border border-destructive/20 w-full">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                <p className="text-2xl font-bold text-destructive">Não Atribuída</p>
                <p className="text-sm text-destructive/80 mt-1">Por favor, consulte a secretaria.</p>
              </div>
            )}
          </div>
          <Button variant="link" onClick={handleReset} className="p-0 h-auto self-center">
            Fazer nova consulta
          </Button>
        </CardFooter>
      ) : selectedCategory ? (
        <CardFooter className="bg-muted/50 p-6 rounded-b-lg mt-4">
          <p className="text-sm text-muted-foreground text-center w-full">Selecione uma turma para ver a sala.</p>
        </CardFooter>
      ) : null}
    </Card>
  );
}
