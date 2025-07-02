
'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, parseISO, isValid, isWithinInterval, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Wrench, BookOpen, Repeat, Calendar as EventCalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { timeRangesOverlap, dateRangesOverlap } from '@/lib/utils';
import type { Classroom, ClassGroup, DayOfWeek, PeriodOfDay, EventReservation, ClassroomRecurringReservation, OccupancyItem } from '@/types';
import { DAYS_OF_WEEK, PERIODS_OF_DAY, JS_DAYS_OF_WEEK_MAP_TO_PT, SHIFT_TIME_RANGES } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RoomAvailabilityDisplayProps {
  initialClassrooms: Classroom[];
  initialClassGroups: ClassGroup[];
  initialEventReservations: EventReservation[];
  initialRecurringReservations: ClassroomRecurringReservation[];
}

const getColumnDateString = (targetDay: DayOfWeek, currentFilterStartDate: Date | undefined): string => {
  if (!currentFilterStartDate || !isValid(currentFilterStartDate)) return '';
  const mondayOfFilterWeek = startOfWeek(currentFilterStartDate, { weekStartsOn: 1 });
  const dayIndex = DAYS_OF_WEEK.indexOf(targetDay);
  if (dayIndex === -1) return '';
  const dateForColumn = addDays(mondayOfFilterWeek, dayIndex);
  return format(dateForColumn, 'dd/MMM', { locale: ptBR });
};

const getShiftColorClass = (shift: PeriodOfDay): string => {
  switch (shift) {
    case 'Manhã':
      return 'bg-sky-100/70 dark:bg-sky-800/40 hover:bg-sky-200/70 dark:hover:bg-sky-700/50';
    case 'Tarde':
      return 'bg-orange-100/70 dark:bg-orange-800/40 hover:bg-orange-200/70 dark:hover:bg-orange-700/50';
    case 'Noite':
      return 'bg-indigo-100/70 dark:bg-indigo-800/40 hover:bg-indigo-200/70 dark:hover:bg-indigo-700/50';
    default:
      return 'bg-muted/50 dark:bg-muted/30';
  }
};

const OccupancyBadge = ({ item, classGroups }: { item: OccupancyItem, classGroups: ClassGroup[] }) => {
  switch(item.type) {
    case 'class':
      return (
        <Tooltip delayDuration={150}>
          <TooltipTrigger className="w-full">
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5 w-full text-left block max-w-full truncate leading-tight border font-medium shadow-xs bg-primary/10 border-primary/20 text-primary dark:bg-primary/20 dark:border-primary/30 hover:bg-primary/20 dark:hover:bg-primary/30")} title={item.data.name}>
              <BookOpen className="h-3 w-3 mr-1 inline-block" />
              {item.data.name}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Aula Regular</p>
            <p>Turma: {item.data.name}</p>
          </TooltipContent>
        </Tooltip>
      );
    case 'recurring':
      const recurringClassGroup = classGroups.find(cg => cg.id === item.data.classGroupId);
      const title = `Reserva: ${item.data.purpose} (${recurringClassGroup?.name || 'Turma desconhecida'})`;
      return (
        <Tooltip delayDuration={150}>
          <TooltipTrigger className="w-full">
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5 w-full text-left block max-w-full truncate leading-tight border font-medium shadow-xs bg-secondary hover:bg-secondary/80")} title={title}>
              <Repeat className="h-3 w-3 mr-1 inline-block" />
              {item.data.purpose}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Reserva Recorrente</p>
            <p>Propósito: {item.data.purpose}</p>
            {recurringClassGroup && <p>Turma: {recurringClassGroup.name}</p>}
          </TooltipContent>
        </Tooltip>
      );
    case 'event':
      const eventTitle = `Evento: ${item.data.title} (${item.data.startTime}-${item.data.endTime})`;
      return (
        <Tooltip delayDuration={150}>
          <TooltipTrigger className="w-full">
            <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5 w-full text-left block max-w-full truncate leading-tight border font-medium shadow-xs bg-accent/10 border-accent/20 text-accent-foreground dark:bg-accent/20 dark:border-accent/30 hover:bg-accent/20 dark:hover:bg-accent/30")} title={eventTitle}>
              <EventCalendarIcon className="h-3 w-3 mr-1 inline-block" />
              {item.data.title}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">Evento Pontual</p>
            <p>Título: {item.data.title}</p>
            <p>Horário: {item.data.startTime} - {item.data.endTime}</p>
            <p>Reservado por: {item.data.reservedBy}</p>
          </TooltipContent>
        </Tooltip>
      );
    default:
      return null;
  }
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

  const startDate = useMemo(() => date ? startOfWeek(date, { weekStartsOn: 1 }) : undefined, [date]);
  const endDate = useMemo(() => startDate ? addDays(startDate, 6) : undefined, [startDate]);

  const weeklySchedule = useMemo(() => {
    if (!startDate || !endDate) return new Map<string, OccupancyItem[]>();

    const schedule = new Map<string, OccupancyItem[]>();
    
    const addOccupation = (key: string, item: OccupancyItem) => {
        if (!schedule.has(key)) schedule.set(key, []);
        schedule.get(key)!.push(item);
    };

    // 1. Process regular class groups
    initialClassGroups.forEach(cg => {
        if (cg.status !== 'Em Andamento' || !cg.assignedClassroomId) return;
        const cgStart = parseISO(cg.startDate);
        const cgEnd = parseISO(cg.endDate);
        if (!isValid(cgStart) || !isValid(cgEnd)) return;

        if (dateRangesOverlap(cgStart, cgEnd, startDate, endDate)) {
            cg.classDays.forEach(day => {
                const key = `${cg.assignedClassroomId}-${day}-${cg.shift}`;
                addOccupation(key, { type: 'class', data: cg });
            });
        }
    });

    // 2. Process recurring reservations
    initialRecurringReservations.forEach(res => {
      const resStart = parseISO(res.startDate);
      const resEnd = parseISO(res.endDate);
      if (!isValid(resStart) || !isValid(resEnd)) return;
      
      const classGroup = initialClassGroups.find(cg => cg.id === res.classGroupId);
      if (!classGroup) return;

      if (dateRangesOverlap(resStart, resEnd, startDate, endDate)) {
        classGroup.classDays.forEach(day => {
          const key = `${res.classroomId}-${day}-${classGroup.shift}`;
          addOccupation(key, { type: 'recurring', data: res });
        });
      }
    });

    // 3. Process event reservations
    initialEventReservations.forEach(event => {
      try {
        const eventDate = parseISO(event.date);
        if (!isValid(eventDate)) return;

        if (isWithinInterval(eventDate, { start: startDate, end: endDate })) {
          const dayOfWeek = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(eventDate)];
          PERIODS_OF_DAY.forEach(shift => {
            const shiftTimes = SHIFT_TIME_RANGES[shift];
            if (timeRangesOverlap(event.startTime, event.endTime, shiftTimes.start, shiftTimes.end)) {
              const key = `${event.classroomId}-${dayOfWeek}-${shift}`;
              addOccupation(key, { type: 'event', data: event });
            }
          });
        }
      } catch (e) {
        console.error(`Error processing event reservation ${event.id}:`, e);
      }
    });

    return schedule;

  }, [startDate, endDate, initialClassGroups, initialEventReservations, initialRecurringReservations]);

  const getOccupancyForCell = (classroomId: string, day: DayOfWeek, shift: PeriodOfDay): OccupancyItem[] => {
    const key = `${classroomId}-${day}-${shift}`;
    return weeklySchedule.get(key) || [];
  };

  const isCellOccupied = (classroomId: string, day: DayOfWeek): boolean => {
    return PERIODS_OF_DAY.some(shift => {
      const key = `${classroomId}-${day}-${shift}`;
      return weeklySchedule.has(key) && weeklySchedule.get(key)!.length > 0;
    });
  }

  return (
      <div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg items-end bg-card">
          <div className="flex-1">
            <label htmlFor="weekPicker" className="block text-sm font-medium text-foreground mb-1">Semana</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="weekPicker"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate && endDate ? (
                    `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`
                  ) : (
                    <span>Escolha uma data</span>
                  )}
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
        </div>

        {!startDate || !endDate ? (
          <p className="text-muted-foreground text-center py-4">Selecione uma data para ver a disponibilidade da semana.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-md bg-card">
            <Table className="min-w-full table-fixed">
              <TableHeader className="sticky top-0 z-20 bg-muted/95 dark:bg-muted backdrop-blur-sm shadow-sm">
                <TableRow>
                  <TableHead className="w-[160px] min-w-[160px] sticky top-0 left-0 bg-muted/95 dark:bg-muted z-30 shadow-sm text-sm font-semibold text-foreground border-r px-3 py-3 align-middle">Sala</TableHead>
                  {DAYS_OF_WEEK.map(day => (
                    <TableHead key={day} className="w-[180px] min-w-[180px] text-center whitespace-nowrap text-sm font-semibold text-foreground border-r px-2 py-3 align-middle">
                      {day.substring(0,3)}
                      <br />
                      <span className="text-xs font-normal text-muted-foreground">{getColumnDateString(day, startDate)}</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialClassrooms.map((room: Classroom) => (
                  <TableRow key={room.id} className="hover:bg-muted/20 dark:hover:bg-muted/50 transition-colors duration-150">
                    <TableCell className={cn("font-medium sticky left-0 bg-card dark:bg-muted z-10 shadow-sm whitespace-nowrap text-sm py-3 px-3 border-r align-top min-h-[170px]", room.isUnderMaintenance && "bg-amber-50 dark:bg-amber-900/50")}>
                      {room.name}
                      <span className="block text-xs text-muted-foreground mt-0.5">(Cap: {room.capacity ?? 'N/A'})</span>
                      {room.isUnderMaintenance && (
                         <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="mt-1.5 text-xs bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200 dark:border-amber-600 cursor-default">
                              <Wrench className="mr-1.5 h-3 w-3" />
                              Manutenção
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="bg-background text-foreground border shadow-lg rounded-md p-2 text-xs max-w-xs">
                            <p className="font-semibold mb-1">Sala em Manutenção</p>
                            <p>Motivo: {room.maintenanceReason || 'Não especificado'}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    {DAYS_OF_WEEK.map(day => (
                      <TableCell
                        key={day}
                        className={cn(
                          "align-top p-0.5 transition-colors duration-150 h-[170px] border-r relative",
                          room.isUnderMaintenance ? 'bg-amber-100/70 dark:bg-amber-900/40 opacity-70' : isCellOccupied(room.id, day) ? 'bg-muted/40 dark:bg-muted/20' : 'bg-background dark:bg-card'
                        )}
                      >
                        {room.isUnderMaintenance ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-amber-100/50 dark:bg-amber-800/40 backdrop-blur-xs">
                              <Wrench className="h-8 w-8 text-amber-500 dark:text-amber-400" />
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-0.5 h-full text-xs">
                            {PERIODS_OF_DAY.map(shift => {
                              const scheduledItems = getOccupancyForCell(room.id, day, shift);
                              return (
                                <div
                                  key={shift}
                                  className={cn(
                                    "flex-1 p-1 rounded-sm border border-border/30 shadow-sm transition-all flex flex-col items-center min-h-[55px]", 
                                    getShiftColorClass(shift),
                                    scheduledItems.length > 0 ? "justify-start pt-0.5" : "justify-center"
                                  )}
                                >
                                  {scheduledItems.length > 0 ? (
                                    <div className="flex flex-col gap-0.5 items-center justify-start w-full">
                                      {scheduledItems.slice(0, 2).map((item, index) => (
                                        <OccupancyBadge key={`${item.type}-${('id' in item.data) ? item.data.id : index}`} item={item} classGroups={initialClassGroups} />
                                      ))}
                                      {scheduledItems.length > 2 && (
                                        <Badge variant="outline" className="text-[9px] px-1 mt-0.5 w-full text-center bg-muted/50 dark:bg-muted/70">
                                          +{scheduledItems.length - 2} ocupação(ões)
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] px-2 py-1 bg-primary/10 border-primary/20 text-primary dark:bg-primary/20 dark:text-primary-foreground font-semibold shadow-xs">
                                      Livre
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
  );
}
