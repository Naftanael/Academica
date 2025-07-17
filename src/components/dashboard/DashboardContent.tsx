
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ActiveClassGroups } from './ActiveClassGroups';
import ClassroomOccupancyChart from './ClassroomOccupancyChart';
import { DashboardData, ClassGroup, ClassGroupWithDates } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function determineClassGroupStatus(cg: ClassGroup): 'Em Andamento' | 'Planejada' | 'Concluída' {
    const now = new Date();
    const startDate = new Date(cg.startDate);
    const endDate = new Date(cg.endDate);

    if (now >= startDate && now <= endDate) {
        return 'Em Andamento';
    } else if (now < startDate) {
        return 'Planejada';
    } else {
        return 'Concluída';
    }
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'active' | 'occupancy'>('active');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Mock data for now
        const dashboardData: {
            stats: any,
            classGroups: ClassGroup[],
            classroomOccupancyChartData: any[],
            currentDate: string
        } = {
            stats: {
                totalClassGroups: 0,
                activeClassGroups: 0,
                plannedClassGroups: 0,
                totalClassrooms: 0,
            },
            classGroups: [],
            classroomOccupancyChartData: [],
            currentDate: new Date().toISOString(),
        };
        
        // Add status to each class group
        const classGroupsWithDates: ClassGroupWithDates[] = dashboardData.classGroups.map(cg => ({
            ...cg,
            status: determineClassGroupStatus(cg),
            formattedStartDate: new Date(cg.startDate).toLocaleDateString(),
            formattedEndDate: new Date(cg.endDate).toLocaleDateString(),
            nearEnd: false, // You might want to implement this logic
        }));

        const activeClassGroupsData = classGroupsWithDates.filter(cg => cg.status === 'Em Andamento');

        const categorizedActiveClassGroups = new Map();
        activeClassGroupsData.forEach(cg => {
            const category = 'Todas';
            if (!categorizedActiveClassGroups.has(category)) {
                categorizedActiveClassGroups.set(category, []);
            }
            categorizedActiveClassGroups.get(category).push(cg);
        });

        setData({
            ...dashboardData,
            activeClassGroups: activeClassGroupsData,
            categorizedActiveClassGroups
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!data) {
    return <div>Não foi possível carregar os dados.</div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.totalClassGroups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Turmas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.activeClassGroups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Turmas Planejadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.plannedClassGroups}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de Salas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.totalClassrooms}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Select value={view} onValueChange={(value) => setView(value as any)}>
          <SelectTrigger className="w-[200px] mb-4">
            <SelectValue placeholder="Selecione a visualização" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Turmas Ativas</SelectItem>
            <SelectItem value="occupancy">Ocupação das Salas</SelectItem>
          </SelectContent>
        </Select>

        {view === 'active' ? (
          <ActiveClassGroups 
            categorizedClassGroups={data.categorizedActiveClassGroups}
            totalActive={data.stats.activeClassGroups} 
          />
        ) : (
          <ClassroomOccupancyChart data={data.classroomOccupancyChartData} />
        )}
      </div>
    </div>
  );
}
