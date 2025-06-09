
import { readData } from '@/lib/data-utils';
import type { ClassGroup, DashboardStats, Classroom, Course } from '@/types';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Presentation, UsersRound, TrendingUp, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Progress } from "@/components/ui/progress";
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

async function getDashboardData() {
  const classrooms = await readData<Classroom>('classrooms.json');
  const classGroups = await readData<ClassGroup>('classgroups.json');

  const currentDate = new Date();

  const activeClassGroups = classGroups.filter(cg => cg.status === 'Em Andamento');
  const plannedClassGroups = classGroups.filter(cg => cg.status === 'Planejada');

  const stats: DashboardStats = {
    totalClassGroups: classGroups.length,
    activeClassGroups: activeClassGroups.length,
    plannedClassGroups: plannedClassGroups.length,
    totalClassrooms: classrooms.length,
  };

  // Enhance active class groups with more details
  const detailedActiveClassGroups = activeClassGroups.map(cg => {
    const completedDisciplines = cg.disciplines.filter(d => d.completed).length;
    const totalDisciplines = cg.disciplines.length;
    const progress = totalDisciplines > 0 ? (completedDisciplines / totalDisciplines) * 100 : 0;
    
    let currentOrNextDiscipline: { name: string; } | null = null;
    const firstPendingDisciplineCourseId = cg.disciplines.find(d => !d.completed)?.courseId;
    if (firstPendingDisciplineCourseId) {
        const course = courses.find(c => c.id === firstPendingDisciplineCourseId);
        if (course) {
            currentOrNextDiscipline = { name: course.name };
        }
    }

    const startDate = parseISO(cg.startDate);
    const endDate = parseISO(cg.endDate);
    const daysRemaining = differenceInDays(endDate, currentDate);
    const nearEnd = daysRemaining <= 7 && daysRemaining >= 0;

    return {
      ...cg,
      progress,
      completedDisciplines,
      totalDisciplines,
      pendingDisciplines: totalDisciplines - completedDisciplines,
      currentOrNextDiscipline,
      formattedStartDate: format(startDate, 'dd/MM/yyyy'),
      formattedEndDate: format(endDate, 'dd/MM/yyyy'),
      nearEnd,
    };
  });

  return { stats, activeClassGroups: detailedActiveClassGroups, currentDate };
}

// Helper to get courses for discipline details, to be called inside getDashboardData
let courses: Course[] = [];
async function loadCourses() {
    courses = await readData<Course>('courses.json');
}


export default async function DashboardPage() {
  await loadCourses(); // load courses data to be available for getDashboardData
  const { stats, activeClassGroups, currentDate } = await getDashboardData();

  const statItems = [
    { title: 'Total de Turmas', value: stats.totalClassGroups, icon: UsersRound, color: 'text-blue-500' },
    { title: 'Turmas em Andamento', value: stats.activeClassGroups, icon: TrendingUp, color: 'text-green-500' },
    { title: 'Turmas Planejadas', value: stats.plannedClassGroups, icon: CalendarClock, color: 'text-yellow-500' },
    { title: 'Total de Salas', value: stats.totalClassrooms, icon: Presentation, color: 'text-indigo-500' },
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
          <Card className="p-6 text-center text-muted-foreground">
            Nenhuma turma em andamento no momento.
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {activeClassGroups.map((cg) => (
              <Card key={cg.id} className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${cg.nearEnd ? 'border-2 border-destructive' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-semibold">{cg.name}</CardTitle>
                    {cg.nearEnd && <Badge variant="destructive">Perto do Fim</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cg.shift} - {cg.year}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <span>{cg.completedDisciplines}/{cg.totalDisciplines} disciplinas</span>
                    </div>
                    <Progress value={cg.progress} className="h-2" />
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Período:</span> {cg.formattedStartDate} - {cg.formattedEndDate}
                  </p>
                  {cg.currentOrNextDiscipline && (
                    <p className="text-sm">
                      <span className="font-medium">Próx. Disciplina:</span> {cg.currentOrNextDiscipline.name}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Disciplinas Pendentes:</span> {cg.pendingDisciplines}
                  </p>
                  <Link href={`/classgroups/${cg.id}`} className="text-sm text-primary hover:underline">
                    Ver Detalhes da Turma
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
