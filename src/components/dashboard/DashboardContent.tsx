
import { getClassrooms } from '@/lib/actions/classrooms';
import { getClassGroups } from '@/lib/actions/classgroups';
import type { ClassGroup, DashboardStats, Classroom, DayOfWeek, ClassGroupWithDates, DailyOccupancy, DashboardData, CategorizedClassGroups } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, Presentation, UsersRound, TrendingUp } from 'lucide-react';
import { format, parseISO, differenceInDays, isValid, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DAYS_OF_WEEK } from '@/lib/constants';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const courseCategories = [
  { name: 'Téc. em Farmácia', prefix: 'FMC' },
  { name: 'Téc. em Radiologia', prefix: 'RAD' },
  { name: 'Téc. em Enfermagem', prefix: 'ENF' },
  { name: 'Administração', prefix: 'ADM' },
  { name: 'Cuidador de Idoso', prefix: 'CDI' },
  { name: 'Outros', prefix: 'OTHERS' }
];

const extractNumber = (name: string) => {
    const match = name.match(/\d+/);
    return match ? parseInt(match[0], 10) : Infinity;
};

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
  const [classrooms, classGroups] = await Promise.all([
    getClassrooms(),
    getClassGroups(),
  ]);

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
    let daysRemaining: number | undefined;
    const formattedStartDate = cg.startDate ? format(parseISO(cg.startDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';
    const formattedEndDate = cg.endDate ? format(parseISO(cg.endDate), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A';
    
    if (cg.endDate) {
        const endDate = parseISO(cg.endDate);
        if(isValid(endDate)) {
            daysRemaining = differenceInDays(endDate, currentDate);
        }
    }
    const nearEnd = daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining >= 0;

    return { ...cg, formattedStartDate, formattedEndDate, nearEnd };
  });
  
  const categorizedActiveClassGroups = categorizeAndSortClassGroups(detailedActiveClassGroups);

  const dailyOccupancyCounts: { [key in DayOfWeek]: number } = {
    'Segunda': 0, 'Terça': 0, 'Quarta': 0, 'Quinta': 0, 'Sexta': 0, 'Sábado': 0, 'Domingo': 0,
  };

  activeClassGroupsData.forEach(cg => {
    if (cg.assignedClassroomId && Array.isArray(cg.classDays) && !classrooms.find(c => c.id === cg.assignedClassroomId)?.isUnderMaintenance) {
      cg.classDays.forEach(day => {
        if (dailyOccupancyCounts[day] !== undefined) dailyOccupancyCounts[day]++;
      });
    }
  });

  const classroomOccupancyChartData: DailyOccupancy[] = DAYS_OF_WEEK.map(day => ({
    day: day.substring(0, 3), day_full: day, turmas: dailyOccupancyCounts[day],
  }));

  return { 
    stats, 
    activeClassGroups: detailedActiveClassGroups, 
    currentDate: currentDate.toISOString(), 
    classroomOccupancyChartData, 
    categorizedActiveClassGroups 
  };
}

const ClassroomOccupancyChart = dynamic(() => import('@/components/dashboard/ClassroomOccupancyChart'), {
  loading: () => <Skeleton className="h-[350px] w-full" />,
  ssr: false
});
const ActiveClassGroups = dynamic(() => import('@/components/dashboard/ActiveClassGroups'), {
  loading: () => <Skeleton className="h-[500px] w-full" />,
  ssr: false
});

export default async function DashboardContent() {
  const { stats, activeClassGroups, classroomOccupancyChartData, categorizedActiveClassGroups } = await getDashboardData();
  
  const serializableCategorizedGroups = categorizedActiveClassGroups 
    ? Object.fromEntries(categorizedActiveClassGroups)
    : {};

  const statItems = [
    { title: 'Total de Turmas', value: stats.totalClassGroups, icon: UsersRound, className: 'text-primary' },
    { title: 'Turmas em Andamento', value: stats.activeClassGroups, icon: TrendingUp, className: 'text-primary' },
    { title: 'Turmas Planejadas', value: stats.plannedClassGroups, icon: CalendarClock, className: 'text-accent' },
    { title: 'Total de Salas', value: stats.totalClassrooms, icon: Presentation, className: 'text-muted-foreground' },
  ];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statItems.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ClassroomOccupancyChart data={classroomOccupancyChartData} />
        <ActiveClassGroups 
          activeClassGroups={activeClassGroups} 
          categorizedActiveClassGroups={serializableCategorizedGroups} 
        />
      </div>
    </>
  );
}
