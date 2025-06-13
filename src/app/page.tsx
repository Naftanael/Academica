
import { readData } from '@/lib/data-utils';
import type { ClassGroup, DashboardStats, Classroom } from '@/types'; // Removed Course type
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Presentation, UsersRound, TrendingUp, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
// Progress component might be unused now, but keeping for other potential uses.
// import { Progress } from "@/components/ui/progress"; 
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getDashboardData() {
  const classrooms = await readData<Classroom>('classrooms.json');
  const classGroups = await readData<ClassGroup>('classgroups.json');

  const currentDate = new Date();

  const activeClassGroupsData = classGroups.filter(cg => cg.status === 'Em Andamento');
  const plannedClassGroups = classGroups.filter(cg => cg.status === 'Planejada');

  const stats: DashboardStats = {
    totalClassGroups: classGroups.length,
    activeClassGroups: activeClassGroupsData.length,
    plannedClassGroups: plannedClassGroups.length,
    totalClassrooms: classrooms.length,
  };

  // Enhance active class groups with more details
  const detailedActiveClassGroups = activeClassGroupsData.map(cg => {
    const startDate = parseISO(cg.startDate);
    const endDate = parseISO(cg.endDate);
    const daysRemaining = differenceInDays(endDate, currentDate);
    const nearEnd = daysRemaining <= 7 && daysRemaining >= 0;

    return {
      ...cg,
      // Removed discipline-related properties: progress, completedDisciplines, totalDisciplines, pendingDisciplines, currentOrNextDiscipline
      formattedStartDate: format(startDate, 'dd/MM/yyyy'),
      formattedEndDate: format(endDate, 'dd/MM/yyyy'),
      nearEnd,
    };
  });

  return { stats, activeClassGroups: detailedActiveClassGroups, currentDate };
}

// loadCourses function and 'courses' variable removed as they are no longer needed.

export default async function DashboardPage() {
  // await loadCourses(); // Removed
  const { stats, activeClassGroups, currentDate } = await getDashboardData();

  const statItems = [
    { title: 'Total de Turmas', value: stats.totalClassGroups, icon: UsersRound, color: 'text-primary' },
    { title: 'Turmas em Andamento', value: stats.activeClassGroups, icon: TrendingUp, color: 'text-green-500' }, // Consider a theme color
    { title: 'Turmas Planejadas', value: stats.plannedClassGroups, icon: CalendarClock, color: 'text-yellow-500' }, // Consider a theme color
    { title: 'Total de Salas', value: stats.totalClassrooms, icon: Presentation, color: 'text-accent' },
  ];

  return (
    <>
      <PageHeader 
        title="Dashboard" 
        description={`Bem-vindo(a) ao Painel Academica. Hoje é ${format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`}
        icon={LayoutDashboard} 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {statItems.map((item) => (
          <Card key={item.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Turmas em Andamento ({activeClassGroups.length})</h2>
        {activeClassGroups.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground shadow-lg">
            Nenhuma turma em andamento no momento.
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {activeClassGroups.map((cg) => (
              <Card key={cg.id} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${cg.nearEnd ? 'border-2 border-destructive' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-semibold font-headline">{cg.name}</CardTitle>
                    {cg.nearEnd && <Badge variant="destructive">Perto do Fim</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cg.shift} - {cg.year}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Removed Progress bar and discipline counts */}
                  <p className="text-sm">
                    <span className="font-medium">Período:</span> {cg.formattedStartDate} - {cg.formattedEndDate}
                  </p>
                  {/* Removed Current/Next Discipline and Pending Disciplines */}
                  <Link href={`/classgroups/${cg.id}`} className="text-sm text-primary hover:underline block mt-2">
                    Ver Detalhes da Turma (em breve)
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
