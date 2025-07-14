
import Link from 'next/link';
import { PlusCircle, UsersRound, Pill, ScanLine, Stethoscope, Briefcase, BookOpen } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { getClassGroups } from '@/lib/actions/classgroups';
import { getClassrooms } from '@/lib/actions/classrooms';
import ClassGroupsTable from '@/components/classgroups/ClassGroupsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ClassGroup } from '@/types';

// Mapeamento de prefixos de curso para nomes e ícones
const courseCategories = [
  { name: 'Téc. em Farmácia', prefix: 'FMC', icon: Pill },
  { name: 'Téc. em Radiologia', prefix: 'RAD', icon: ScanLine },
  { name: 'Téc. em Enfermagem', prefix: 'ENF', icon: Stethoscope },
  { name: 'Administração', prefix: 'ADM', icon: Briefcase },
  { name: 'Outros', prefix: 'OTHERS', icon: BookOpen } // Categoria para cursos não mapeados
];

type CategorizedClassGroups = Map<string, ClassGroup[]>;

// Helper para extrair o número do nome da turma para ordenação
const extractNumber = (name: string) => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : Infinity;
};

// Helper para categorizar e ordenar as turmas
const categorizeAndSortClassGroups = (classGroups: ClassGroup[]): CategorizedClassGroups => {
    const categorized: CategorizedClassGroups = new Map();
    courseCategories.forEach(c => categorized.set(c.name, []));

    classGroups.forEach(cg => {
        const category = courseCategories.find(c => c.prefix !== 'OTHERS' && cg.name.toUpperCase().startsWith(c.prefix));
        if (category) {
            categorized.get(category.name)?.push(cg);
        } else {
            categorized.get('Outros')?.push(cg);
        }
    });

    // Ordena as turmas dentro de cada categoria e remove categorias vazias
    for (const [key, groups] of categorized.entries()) {
        if (groups.length === 0) {
            categorized.delete(key);
        } else {
            groups.sort((a, b) => extractNumber(a.name) - extractNumber(b.name));
        }
    }
    return categorized;
};

export default async function ClassGroupsPage() {
  const classGroups = await getClassGroups();
  const classrooms = await getClassrooms();
  const categorizedClassGroups = categorizeAndSortClassGroups(classGroups);
  
  const categoryOrder = courseCategories.map(c => c.name);
  const sortedCategories = Array.from(categorizedClassGroups.keys()).sort((a,b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

  return (
    <>
      <PageHeader
        title="Turmas"
        description="Gerencie as turmas da sua instituição."
        icon={UsersRound}
        actions={
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href="/classgroups/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Turma
            </Link>
          </Button>
        }
      />
      
      {classGroups.length === 0 ? (
        <ClassGroupsTable classGroups={[]} classrooms={[]} />
      ) : (
        <Tabs defaultValue={sortedCategories[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto flex-wrap p-1">
                {sortedCategories.map(categoryName => {
                    const category = courseCategories.find(c => c.name === categoryName);
                    const count = (categorizedClassGroups.get(categoryName) || []).length;
                    return (
                    <TabsTrigger key={categoryName} value={categoryName} className="flex items-center gap-2">
                        {category?.icon && <category.icon className="h-4 w-4" />}
                        {categoryName} {count > 0 && <span className="ml-1 text-xs opacity-80">({count})</span>}
                    </TabsTrigger>
                    )
                })}
            </TabsList>
            {sortedCategories.map(categoryName => (
                <TabsContent key={categoryName} value={categoryName} className="mt-4">
                    <ClassGroupsTable 
                        classGroups={categorizedClassGroups.get(categoryName) || []} 
                        classrooms={classrooms} 
                    />
                </TabsContent>
            ))}
        </Tabs>
      )}
    </>
  );
}
