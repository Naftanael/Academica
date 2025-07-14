
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { CategorizedClassGroups, ClassGroupWithDates } from '@/types';
import { Pill, ScanLine, Stethoscope, Briefcase, BookOpen, UsersRound } from 'lucide-react';

const courseCategories = [
  { name: 'Téc. em Farmácia', prefix: 'FMC', icon: Pill },
  { name: 'Téc. em Radiologia', prefix: 'RAD', icon: ScanLine },
  { name: 'Téc. em Enfermagem', prefix: 'ENF', icon: Stethoscope },
  { name: 'Administração', prefix: 'ADM', icon: Briefcase },
  { name: 'Cuidador de Idoso', prefix: 'CDI', icon: UsersRound },
  { name: 'Outros', prefix: 'OTHERS', icon: BookOpen }
];

interface ActiveClassGroupsProps {
  activeClassGroups: ClassGroupWithDates[];
  categorizedActiveClassGroups: CategorizedClassGroups;
}

export default function ActiveClassGroups({ activeClassGroups, categorizedActiveClassGroups }: ActiveClassGroupsProps) {
  const categoryOrder = courseCategories.map(c => c.name);
  const sortedCategories = Array.from(categorizedActiveClassGroups?.keys() || []).sort((a,b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
  
  if (activeClassGroups.length === 0 || !categorizedActiveClassGroups || categorizedActiveClassGroups.size === 0) {
    return (
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
            <CardTitle className="text-xl font-semibold font-headline">Turmas em Andamento (0)</CardTitle>
            <CardDescription>Nenhuma turma em andamento no momento.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="p-6 text-center text-muted-foreground">
                Nenhuma turma em andamento para exibir.
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold font-headline">Turmas em Andamento ({activeClassGroups.length})</CardTitle>
        <CardDescription>Turmas ativas agrupadas por curso.</CardDescription>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue={sortedCategories[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {sortedCategories.map(categoryName => {
                 const category = courseCategories.find(c => c.name === categoryName);
                 const count = (categorizedActiveClassGroups?.get(categoryName) || []).length;
                 return (
                    <TabsTrigger key={categoryName} value={categoryName}>
                      {category?.icon && <category.icon className="mr-2 h-4 w-4" />}
                      {categoryName} {count > 0 && <span className="ml-1.5 text-xs opacity-80">({count})</span>}
                    </TabsTrigger>
                 )
              })}
            </TabsList>
            {sortedCategories.map(categoryName => (
                <TabsContent key={categoryName} value={categoryName}>
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 pt-4">
                        {(categorizedActiveClassGroups?.get(categoryName) || []).map((cg: ClassGroupWithDates) => (
                        <Card key={cg.id} className={`shadow-md hover:shadow-lg transition-shadow duration-300 rounded-md ${cg.nearEnd ? 'border-2 border-destructive' : 'border-border'}`}>
                            <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-semibold font-headline">{cg.name}</CardTitle>
                                {cg.nearEnd && <Badge variant="destructive">Perto do Fim</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {cg.year} - {cg.shift}
                            </p>
                            </CardHeader>
                            <CardContent className="space-y-2">
                            <p className="text-sm">
                                <span className="font-medium">Período:</span> {cg.formattedStartDate} - {cg.formattedEndDate}
                            </p>
                            <Link href={`/classgroups/${cg.id}/edit`} className="text-sm text-primary hover:underline block mt-2 font-medium">
                                Ver Detalhes / Editar
                            </Link>
                            </CardContent>
                        </Card>
                        ))}
                    </div>
                </TabsContent>
            ))}
          </Tabs>
      </CardContent>
    </Card>
  );
}
