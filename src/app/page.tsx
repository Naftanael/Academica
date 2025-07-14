
import { readData } from '@/lib/data-utils';
import type { ClassGroup, DashboardStats, Classroom, DayOfWeek, ClassGroupWithDates, DailyOccupancy, DashboardData, CategorizedClassGroups } from '@/types';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Presentation, UsersRound, TrendingUp, LayoutDashboard, Pill, ScanLine, Stethoscope, Briefcase, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, differenceInDays, isValid, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DAYS_OF_WEEK } from '@/lib/constants';
import ClassroomOccupancyChart from '@/components/dashboard/ClassroomOccupancyChart';
import ExportTvDisplayButton from '@/components/dashboard/ExportTvDisplayButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mapeamento de prefixos de curso para nomes e ícones
const courseCategories = [
  { name: 'Téc. em Farmácia', prefix: 'FMC', icon: Pill },
  { name: 'Téc. em Radiologia', prefix: 'RAD', icon: ScanLine },
  { name: 'Téc. em Enfermagem', prefix: 'ENF', icon: Stethoscope },
  { name: 'Administração', prefix: 'ADM', icon: Briefcase },
  { name: 'Cuidador de Idoso', prefix: 'CDI', icon: UsersRound },
  { name: 'Outros', prefix: 'OTHERS', icon: BookOpen } // Categoria para cursos não mapeados
];

// Helper para extrair o número do nome da turma para ordenação
const extractNumber = (name: string) => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : Infinity;
};

// Helper para categorizar e ordenar as turmas
const categorizeAndSortClassGroups = (classGroups: ClassGroupWithDates[]): CategorizedClassGroups => {
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

async function getDashboardData(): Promise<DashboardData> {
  const classrooms = await readData<Classroom>('classrooms.json');
  const classGroups = await readData<ClassGroup>('classgroups.json');

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const activeClassGroupsData = classGroups.filter(cg => cg.status === 'Em Andamento');

  const stats: DashboardStats = {
    totalClassGroups: classGroups.length,
    activeClassGroups: activeClassGroupsData.length,
    plannedClassGroups: classGroups.filter(cg => cg.status === 'Planejada').length,
    totalClassrooms: classrooms.length,
  };

  const detailedActiveClassGroups: ClassGroupWithDates[] = activeClassGroupsData.map(cg => {
    let parsedStartDate: Date | null = null;
    let parsedEndDate: Date | null = null;
    let daysRemaining: number | undefined = undefined;
    let formattedStartDate = 'Data Início Inválida';
    let formattedEndDate = 'Data Fim Inválida';
    let nearEnd = false;

    if (typeof cg.startDate === 'string') {
      try {
        const tempStartDate = parseISO(cg.startDate);
        if (isValid(tempStartDate)) {
            parsedStartDate = tempStartDate;
            formattedStartDate = format(parsedStartDate, 'dd/MM/yyyy', { locale: ptBR });
        }
      } catch (e) {
        console.warn(`Dashboard: Could not parse startDate "${cg.startDate}" for class group ${cg.id}.`, e);
      }
    }

    if (typeof cg.endDate === 'string') {
      try {
        const tempEndDate = parseISO(cg.endDate);
        if (isValid(tempEndDate)) {
            parsedEndDate = tempEndDate;
            formattedEndDate = format(tempEndDate, 'dd/MM/yyyy', { locale: ptBR });
        }
      } catch (e) {
         console.warn(`Dashboard: Could not parse endDate "${cg.endDate}" for class group ${cg.id}.`, e);
      }
    }

    if (parsedStartDate && parsedEndDate) {
        if (!isAfter(parsedStartDate, parsedEndDate)) {
            daysRemaining = differenceInDays(parsedEndDate, currentDate);
            nearEnd = daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining >= 0;
        }
    }

    return {
      ...cg,
      formattedStartDate,
      formattedEndDate,
      nearEnd,
    };
  });
  
  const categorizedActiveClassGroups = categorizeAndSortClassGroups(detailedActiveClassGroups);

  const classroomMap = new Map(classrooms.map(room => [room.id, room]));
  const dailyOccupancyCounts: { [key in DayOfWeek]: number } = {
    'Segunda': 0, 'Terça': 0, 'Quarta': 0, 'Quinta': 0, 'Sexta': 0, 'Sábado': 0, 'Domingo': 0,
  };

  activeClassGroupsData.forEach(cg => {
    if (cg.assignedClassroomId) {
      const classroom = classroomMap.get(cg.assignedClassroomId);
      if (classroom && !classroom.isUnderMaintenance) {
        if (Array.isArray(cg.classDays)) {
          cg.classDays.forEach(day => {
            if (dailyOccupancyCounts[day] !== undefined) {
              dailyOccupancyCounts[day]++;
            }
          });
        }
      }
    }
  });

  const classroomOccupancyChartData: DailyOccupancy[] = DAYS_OF_WEEK.map(day => ({
    day: day.substring(0, 3),
    day_full: day,
    turmas: dailyOccupancyCounts[day],
  }));

  return { stats, activeClassGroups: detailedActiveClassGroups, currentDate, classroomOccupancyChartData, categorizedActiveClassGroups };
}


export default async function DashboardPage() {
  const { stats, activeClassGroups, currentDate, classroomOccupancyChartData, categorizedActiveClassGroups }: DashboardData = await getDashboardData();
  
  const categoryOrder = courseCategories.map(c => c.name);
  const sortedCategories = Array.from(categorizedActiveClassGroups?.keys() || []).sort((a,b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

  const statItems = [
    { title: 'Total de Turmas', value: stats.totalClassGroups, icon: UsersRound, className: 'text-primary' },
    { title: 'Turmas em Andamento', value: stats.activeClassGroups, icon: TrendingUp, className: 'text-primary' },
    { title: 'Turmas Planejadas', value: stats.plannedClassGroups, icon: CalendarClock, className: 'text-accent' },
    { title: 'Total de Salas', value: stats.totalClassrooms, icon: Presentation, className: 'text-muted-foreground' },
  ];

  return (
    <>
      <div className="flex justify-between items-center">
        <PageHeader
          title="Dashboard"
          description={`Bem-vindo(a) ao Painel Academica. Hoje é ${format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`}
          icon={LayoutDashboard}
        />
        <ExportTvDisplayButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statItems.map((item) => (
          <Card key={item.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-headline">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.className}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mb-8">
        <ClassroomOccupancyChart data={classroomOccupancyChartData} />
      </section>

      <section>
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold font-headline">Turmas em Andamento ({activeClassGroups.length})</CardTitle>
            <CardDescription>Turmas ativas agrupadas por curso.</CardDescription>
          </CardHeader>
          <CardContent>
            {activeClassGroups.length === 0 || !categorizedActiveClassGroups || categorizedActiveClassGroups.size === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Nenhuma turma em andamento no momento.
              </div>
            ) : (
              <Tabs defaultValue={sortedCategories[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {sortedCategories.map(categoryName => {
                     const category = courseCategories.find(c => c.name === categoryName);
                     return (
                        <TabsTrigger key={categoryName} value={categoryName}>
                          {category?.icon && <category.icon className="mr-2 h-4 w-4" />}
                          {categoryName}
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
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
