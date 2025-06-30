
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Activity, AlertTriangle } from 'lucide-react'; // Icon for chart card header, AlertTriangle for error

const chartConfig = {
  turmas: {
    label: 'Turmas Alocadas',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

interface DailyOccupancy {
  day: string; // Abbreviation for XAxis e.g. "Seg"
  day_full: string; // Full day name for Tooltip e.g. "Segunda"
  turmas: number;
}

interface ClassroomOccupancyChartProps {
  data: DailyOccupancy[];
}

export default function ClassroomOccupancyChart({ data }: ClassroomOccupancyChartProps) {
  if (!Array.isArray(data)) {
    return (
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold font-headline">Ocupação de Salas por Dia</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-semibold text-destructive">Erro ao carregar dados do gráfico.</p>
          <p className="text-sm text-muted-foreground">Não foi possível processar os dados de ocupação.</p>
        </CardContent>
      </Card>
    );
  }

  const chartDataPrepared = data.map(item => ({
    ...item,
    fill: 'var(--color-turmas)', // For Bar component to use the CSS variable
  }));
  
  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold font-headline">Ocupação de Salas por Dia</CardTitle>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <CardDescription>Número de turmas alocadas em salas disponíveis por dia da semana.</CardDescription>
      </CardHeader>
      <CardContent>
        {(!data || data.length === 0 || data.every(d => d.turmas === 0)) ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma ocupação de sala registrada para esta semana.</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart 
                accessibilityLayer
                data={chartDataPrepared}
                width={535}
                height={300}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  domain={[0, 'dataMax + 1']} // Ensure Y-axis shows at least one tick above max value
                />
                <ChartTooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                  content={
                    <ChartTooltipContent 
                      labelFormatter={(label, payload) => {
                        // Find the full day name from the payload if available
                        if (payload && payload.length > 0 && payload[0].payload.day_full) {
                          return payload[0].payload.day_full;
                        }
                        return label; // Fallback to the abbreviated day name
                      }}
                      formatter={(value, name, props) => {
                        // name here refers to the dataKey 'turmas'
                        const configEntry = chartConfig[name as keyof typeof chartConfig];
                        const count = Number(value);
                        const label = count === 1 ? 'turma alocada' : 'turmas alocadas';
                        return (
                          <div className="flex flex-col items-start gap-0.5">
                            <div className="text-sm font-medium text-foreground">{props.payload.day_full || props.payload.day}</div>
                            <div className="flex items-center gap-2">
                                <span 
                                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]" 
                                    style={{backgroundColor: configEntry?.color || 'hsl(var(--foreground))'}}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {configEntry?.label}: {count}
                                </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Bar 
                  dataKey="turmas" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
