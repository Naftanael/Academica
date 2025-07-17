
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
import { DashboardData, ClassGroup, ClassGroupWithDates, ClassGroupStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseISO, isBefore, isAfter, isValid } from 'date-fns';

/**
 * Safely determines the status of a class group based on its dates.
 * Handles null or invalid dates gracefully.
 * @param cg The class group to evaluate.
 * @returns The calculated status of the class group.
 */
function determineClassGroupStatus(cg: ClassGroup): ClassGroupStatus {
    // If dates are not set, we can consider it 'Planned' by default.
    if (!cg.startDate || !cg.endDate) {
        return 'Planejada';
    }
    
    const now = new Date();
    const startDate = parseISO(cg.startDate);
    const endDate = parseISO(cg.endDate);

    // If dates are invalid after parsing, return a default status.
    if (!isValid(startDate) || !isValid(endDate)) {
        return 'Planejada';
    }

    if (isBefore(now, startDate)) {
        return 'Planejada';
    } else if (isAfter(now, endDate)) {
        return 'Concluída';
    } else {
        return 'Em Andamento';
    }
}

/**
 * Safely formats a date string for display.
 * @param dateString The date string to format.
 * @returns A formatted date string or a fallback.
 */
function formatDisplayDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = parseISO(dateString);
    return isValid(date) ? date.toLocaleDateString('pt-BR') : 'Inválida';
}


export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'active' | 'occupancy'>('active');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // This should be a proper API call in a real app.
        // For now, using mock data structure.
        const dashboardData: {
            stats: any,
            classGroups: ClassGroup[],
            classroomOccupancyChartData: any[],
            currentDate: string
        } = {
            stats: { totalClassGroups: 0, activeClassGroups: 0, plannedClassGroups: 0, totalClassrooms: 0 },
            classGroups: [], // This would be fetched from the server
            classroomOccupancyChartData: [],
            currentDate: new Date().toISOString(),
        };
        
        // Add status and formatted dates to each class group safely
        const classGroupsWithDates: ClassGroupWithDates[] = dashboardData.classGroups.map(cg => ({
            ...cg,
            status: determineClassGroupStatus(cg),
            formattedStartDate: formatDisplayDate(cg.startDate),
            formattedEndDate: formatDisplayDate(cg.endDate),
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
          <CardHeader><CardTitle>Total de Turmas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{data.stats.totalClassGroups}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Turmas Ativas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{data.stats.activeClassGroups}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Turmas Planejadas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{data.stats.plannedClassGroups}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total de Salas</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{data.stats.totalClassrooms}</p></CardContent>
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
