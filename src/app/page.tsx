
import { readData } from '@/lib/data-utils';
import type { ClassGroup, DashboardStats, Classroom } from '@/types'; 
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Presentation, UsersRound, TrendingUp, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
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

  const detailedActiveClassGroups = activeClassGroupsData.map(cg => {
    const startDate = parseISO(cg.startDate);
    const endDate = parseISO(cg.endDate);
    const daysRemaining = differenceInDays(endDate, currentDate);
    const nearEnd = daysRemaining <= 7 && daysRemaining >= 0;

    return {
      ...cg,
      formattedStartDate: format(startDate, 'dd/MM/yyyy'),
      formattedEndDate: format(endDate, 'dd/MM/yyyy'),
      nearEnd,
    };
  });

  return { stats, activeClassGroups: detailedActiveClassGroups, currentDate };
}


export default async function DashboardPage() {
  const { stats, activeClassGroups, currentDate } = await getDashboardData();

  const statItems = [
    { title: 'Total de Turmas', value: stats.totalClassGroups, icon: UsersRound, color: 'text-primary' },
    { title: 'Turmas em Andamento', value: stats.activeClassGroups, icon: TrendingUp, color: 'text-green-500' }, 
    { title: 'Turmas Planejadas', value: stats.plannedClassGroups, icon: CalendarClock, color: 'text-orange-500' }, 
    { title: 'Total de Salas', value: stats.totalClassrooms, icon: Presentation, color: 'text-blue-500' }, // Changed to blue for variety, theme accent can be used
  ];

  return (
    <>
      <PageHeader 
        title="Dashboard" 
        description={`Bem-vindo(a) ao Painel Academica. Hoje é ${format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`}
        icon={LayoutDashboard} 
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"> {/* Adjusted lg:grid-cols-4 for better fit */}
        {statItems.map((item) => (
          <Card key={item.title} className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-headline">{item.title}</CardTitle>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <Card className="shadow-lg rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold font-headline">Turmas em Andamento ({activeClassGroups.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {activeClassGroups.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Nenhuma turma em andamento no momento.
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {activeClassGroups.map((cg) => (
                  <Card key={cg.id} className={`shadow-md hover:shadow-lg transition-shadow duration-300 rounded-md ${cg.nearEnd ? 'border-2 border-destructive' : 'border-border'}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold font-headline">{cg.name}</CardTitle>
                        {cg.nearEnd && <Badge variant="destructive">Perto do Fim</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cg.shift} - {cg.year}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Período:</span> {cg.formattedStartDate} - {cg.formattedEndDate}
                      </p>
                      <Link href={`/classgroups/${cg.id}`} className="text-sm text-primary hover:underline block mt-2 font-medium">
                        Ver Detalhes
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
