
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { ClassGroupWithDates } from '@/types';
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
  categorizedActiveClassGroups: { [key: string]: ClassGroupWithDates[] };
}

export default function ActiveClassGroups({ activeClassGroups, categorizedActiveClassGroups }: ActiveClassGroupsProps) {
  const categoryOrder = courseCategories.map(c => c.name);
  const sortedCategories = Object.keys(categorizedActiveClassGroups || {}).sort((a,b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
  
  if (activeClassGroups.length === 0 || !categorizedActiveClassGroups || Object.keys(categorizedActiveClassGroups).length === 0) {
    return (
      <Card>
        <CardHeader>
            <CardTitle>Turmas em Andamento (0)</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle>Turmas em Andamento ({activeClassGroups.length})</CardTitle>
        <CardDescription>Turmas ativas agrupadas por curso.</CardDescription>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue={sortedCategories[0]} className="w-full">
            <TabsList>
              {sortedCategories.map(categoryName => {
                 const category = courseCategories.find(c => c.name === categoryName);
                 const count = (categorizedActiveClassGroups[categoryName] || []).length;
                 return (
                    <TabsTrigger key={categoryName} value={categoryName}>
                      {category?.icon && <category.icon className="mr-2 h-4 w-4" />}
                      {categoryName} {count > 0 && <span>({count})</span>}
                    </TabsTrigger>
                 )
              })}
            </TabsList>
            {sortedCategories.map(categoryName => (
                <TabsContent key={categoryName} value={categoryName}>
                    <div className="grid gap-4 md:grid-cols-2">
                        {(categorizedActiveClassGroups[categoryName] || []).map((cg: ClassGroupWithDates) => (
                        <Card key={cg.id} className={cg.nearEnd ? 'border-destructive' : ''}>
                            <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{cg.name}</CardTitle>
                                {cg.nearEnd && <Badge variant="destructive">Perto do Fim</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {cg.year} - {cg.shift}
                            </p>
                            </CardHeader>
                            <CardContent>
                            <p>
                                <span className="font-medium">Período:</span> {cg.formattedStartDate} - {cg.formattedEndDate}
                            </p>
                            <Link href={`/classgroups/${cg.id}/edit`} className="text-sm text-primary hover:underline">
                                Ver Detalhes
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
