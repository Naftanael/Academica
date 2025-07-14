
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isValid, isWithinInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Wrench, BookOpen, Repeat, Calendar as EventCalendarIcon, CheckCircle, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { timeRangesOverlap } from '@/lib/utils';
import type { Classroom, ClassGroup, DayOfWeek, PeriodOfDay, EventReservation, ClassroomRecurringReservation, OccupancyItem } from '@/types';
import { PERIODS_OF_DAY, JS_DAYS_OF_WEEK_MAP_TO_PT, SHIFT_TIME_RANGES } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RoomAvailabilityDisplayProps {
  initialClassrooms: Classroom[];
  initialClassGroups: ClassGroup[];
  initialEventReservations: EventReservation[];
  initialRecurringReservations: ClassroomRecurringReservation[];
}

interface OccupancyInfo {
  status: 'Livre' | 'Ocupada' | 'Manutenção';
  details: OccupancyItem[];
}

const OccupancyBadge = ({ item, classGroups }: { item: OccupancyItem, classGroups: ClassGroup[] }) => {
  const getTooltipContent = () => {
    switch (item.type) {
      case 'class':
        return <>
          <p className="font-semibold">Aula Regular</p>
          <p>Turma: {item.data.name}</p>
        </>;
      case 'recurring':
        const recurringClassGroup = classGroups.find(cg => cg.id === item.data.classGroupId);
        return <>
          <p className="font-semibold">Reserva Recorrente</p>
          <p>Propósito: {item.data.purpose}</p>
          {recurringClassGroup && <p>Turma: {recurringClassGroup.name}</p>}
        </>;
      case 'event':
        return <>
          <p className="font-semibold">Evento Pontual</p>
          <p>Título: {item.data.title}</p>
          <p>Horário: {item.data.startTime} - {item.data.endTime}</p>
          <p>Reservado por: {item.data.reservedBy}</p>
        </>;
      default: return null;
    }
  };

  const getBadgeContent = () => {
     switch (item.type) {
      case 'class':
        return <><BookOpen className="h-3 w-3 mr-1.5 inline-block" /> {item.data.name}</>;
      case 'recurring':
        return <><Repeat className="h-3 w-3 mr-1.5 inline-block" /> {item.data.purpose}</>;
      case 'event':
        return <><EventCalendarIcon className="h-3 w-3 mr-1.5 inline-block" /> {item.data.title}</>;
      default: return null;
    }
  }

  const getBadgeVariant = () => {
     switch (item.type) {
      case 'class': return 'default';
      case 'recurring': return 'secondary';
      case 'event': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger className="w-full text-left">
        <Badge variant={getBadgeVariant()} className="text-xs px-2 py-1 block max-w-full truncate leading-tight font-medium shadow-sm w-full">
            {getBadgeContent()}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
};

export default function RoomAvailabilityDisplay({ 
  initialClassrooms, 
  initialClassGroups,
  initialEventReservations,
  initialRecurringReservations,
}: RoomAvailabilityDisplayProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    setDate(new Date());
  }, []);

  const dailyOccupancy = useMemo(() => {
    if (!date) return new Map<string, OccupancyItem[]>();

    const dailySchedule = new Map<string, OccupancyItem[]>();
    const selectedDateStart = new Date(date);
    selectedDateStart.setHours(0, 0, 0, 0);
    const selectedDateEnd = new Date(date);
    selectedDateEnd.setHours(23, 59, 59, 999);
    
    const addOccupation = (key: string, item: OccupancyItem) => {
        if (!dailySchedule.has(key)) dailySchedule.set(key, []);
        dailySchedule.get(key)!.push(item);
    };

    // 1. Process regular class groups
    initialClassGroups.forEach(cg => {
        if (cg.status !== 'Em Andamento' || !cg.assignedClassroomId) return;
        const cgStart = parseISO(cg.startDate);
        const cgEnd = parseISO(cg.endDate);
        if (!isValid(cgStart) || !isValid(cgEnd)) return;
        
        const isWithinRange = isWithinInterval(date, { start: cgStart, end: cgEnd });
        const dayOfWeek = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(date)];
        const isCorrectDay = cg.classDays.includes(dayOfWeek);

        if (isWithinRange && isCorrectDay) {
            const key = `${cg.assignedClassroomId}-${cg.shift}`;
            addOccupation(key, { type: 'class', data: cg });
        }
    });

    // 2. Process recurring reservations
    initialRecurringReservations.forEach(res => {
      const resStart = parseISO(res.startDate);
      const resEnd = parseISO(res.endDate);
      if (!isValid(resStart) || !isValid(resEnd)) return;
      
      const classGroup = initialClassGroups.find(cg => cg.id === res.classGroupId);
      if (!classGroup) return;

      const isWithinRange = isWithinInterval(date, { start: resStart, end: resEnd });
      const dayOfWeek = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(date)];
      const isCorrectDay = classGroup.classDays.includes(dayOfWeek);

      if (isWithinRange && isCorrectDay) {
          const key = `${res.classroomId}-${classGroup.shift}`;
          addOccupation(key, { type: 'recurring', data: res });
      }
    });

    // 3. Process event reservations
    initialEventReservations.forEach(event => {
      try {
        const eventDate = parseISO(event.date);
        if (!isValid(eventDate) || format(eventDate, 'yyyy-MM-dd') !== format(date, 'yyyy-MM-dd')) return;

        PERIODS_OF_DAY.forEach(shift => {
          const shiftTimes = SHIFT_TIME_RANGES[shift];
          if (timeRangesOverlap(event.startTime, event.endTime, shiftTimes.start, shiftTimes.end)) {
            const key = `${event.classroomId}-${shift}`;
            addOccupation(key, { type: 'event', data: event });
          }
        });
      } catch (e) {
        console.error(`Error processing event reservation ${event.id}:`, e);
      }
    });

    return dailySchedule;
  }, [date, initialClassGroups, initialEventReservations, initialRecurringReservations]);

  const getOccupancyForCell = (classroomId: string, shift: PeriodOfDay): OccupancyInfo => {
    const classroom = initialClassrooms.find(cr => cr.id === classroomId);
    if (classroom?.isUnderMaintenance) {
      return { status: 'Manutenção', details: [] };
    }
    const key = `${classroomId}-${shift}`;
    const details = dailyOccupancy.get(key) || [];
    return {
      status: details.length > 0 ? 'Ocupada' : 'Livre',
      details
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Disponibilidade Diária de Salas</CardTitle>
            <CardDescription>
              {date ? `Exibindo disponibilidade para ${format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}` : 'Selecione uma data'}
            </CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="datePicker"
                variant={"outline"}
                className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {date ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {initialClassrooms.map(classroom => {
              const morning = getOccupancyForCell(classroom.id, 'Manhã');
              const afternoon = getOccupancyForCell(classroom.id, 'Tarde');
              const night = getOccupancyForCell(classroom.id, 'Noite');

              return (
                <div key={classroom.id} className={cn("rounded-lg border p-4 flex flex-col gap-3", classroom.isUnderMaintenance && "bg-amber-50 dark:bg-amber-900/40 border-amber-500/50")}>
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-foreground">{classroom.name}</h3>
                    {classroom.isUnderMaintenance && (
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger>
                          <Wrench className="h-5 w-5 text-amber-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-semibold">Em Manutenção</p>
                          {classroom.maintenanceReason && <p>{classroom.maintenanceReason}</p>}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  <div className="space-y-2.5 text-sm">
                    {/* Manhã */}
                    <div className="flex items-start gap-3">
                      <span className="w-16 text-muted-foreground font-medium">Manhã</span>
                      {morning.status === 'Manutenção' ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">Manutenção</Badge>
                      ) : morning.status === 'Livre' ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Livre</Badge>
                      ) : (
                          <div className="flex flex-col gap-1 w-full">
                            {morning.details.map((item, index) => <OccupancyBadge key={index} item={item} classGroups={initialClassGroups} />)}
                          </div>
                      )}
                    </div>
                    {/* Tarde */}
                    <div className="flex items-start gap-3">
                      <span className="w-16 text-muted-foreground font-medium">Tarde</span>
                       {afternoon.status === 'Manutenção' ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">Manutenção</Badge>
                      ) : afternoon.status === 'Livre' ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Livre</Badge>
                      ) : (
                           <div className="flex flex-col gap-1 w-full">
                            {afternoon.details.map((item, index) => <OccupancyBadge key={index} item={item} classGroups={initialClassGroups} />)}
                          </div>
                      )}
                    </div>
                    {/* Noite */}
                    <div className="flex items-start gap-3">
                      <span className="w-16 text-muted-foreground font-medium">Noite</span>
                       {night.status === 'Manutenção' ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200">Manutenção</Badge>
                      ) : night.status === 'Livre' ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Livre</Badge>
                      ) : (
                           <div className="flex flex-col gap-1 w-full">
                            {night.details.map((item, index) => <OccupancyBadge key={index} item={item} classGroups={initialClassGroups} />)}
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="text-lg font-medium">Carregando...</p>
            <p>A obter dados de disponibilidade.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
