
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';

interface RoomAvailabilityDisplayProps {
  initialClassrooms: Classroom[];
  initialClassGroups: ClassGroup[];
  initialEventReservations: EventReservation[];
  initialRecurringReservations: ClassroomRecurringReservation[];
}

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
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(initialClassrooms?.[0] || null);
  
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
  
  const getColumnDateString = (targetDay: DayOfWeek, currentFilterStartDate: Date | undefined): string => {
    if (!currentFilterStartDate || !isValid(currentFilterStartDate)) return '';
    const mondayOfFilterWeek = startOfWeek(currentFilterStartDate, { weekStartsOn: 1 });
    const dayIndex = DAYS_OF_WEEK.indexOf(targetDay);
    if (dayIndex === -1) return '';
    const dateForColumn = addDays(mondayOfFilterWeek, dayIndex);
    return format(dateForColumn, 'dd/MM', { locale: ptBR });
  };
  
  return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Classroom Selector */}
        <div className="lg:col-span-4 xl:col-span-3">
            <Card>
            <CardHeader>
                <CardTitle>Selecione a Sala</CardTitle>
                <CardDescription>
                Escolha uma sala para ver sua agenda semanal.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-2">
                    {initialClassrooms.map((room) => (
                    <Button
                        key={room.id}
                        variant={selectedClassroom?.id === room.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start h-auto py-2"
                        onClick={() => setSelectedClassroom(room)}
                    >
                        <div className="flex flex-col items-start text-left">
                        <span className="font-semibold">{room.name}</span>
                        <span className="text-xs text-muted-foreground font-normal">
                            Capacidade: {room.capacity ?? 'N/A'}
                            {room.isUnderMaintenance && (
                            <span className="ml-2 text-amber-500 flex items-center gap-1">
                                <Wrench className="h-3 w-3" /> Manutenção
                            </span>
                            )}
                        </span>
                        </div>
                    </Button>
                    ))}
                </div>
                </ScrollArea>
            </CardContent>
            </Card>
        </div>

        {/* Right Pane: Schedule Display */}
        <div className="lg:col-span-8 xl:col-span-9">
            <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle>
                    Agenda: {selectedClassroom ? selectedClassroom.name : 'Nenhuma sala selecionada'}
                    </CardTitle>
                    <CardDescription>
                    {startDate && endDate ? 
                        `Agenda de ${format(startDate, "dd 'de' MMM", { locale: ptBR })} a ${format(endDate, "dd 'de' MMM, yyyy", { locale: ptBR })}`
                        : 'Selecione uma data'
                    }
                    </CardDescription>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="weekPicker"
                        variant={"outline"}
                        className={cn("w-full sm:w-auto justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>Alterar Semana</span>
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
                {selectedClassroom?.isUnderMaintenance && (
                    <div className="mt-4 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                        <Wrench className="h-4 w-4" />
                        <p>
                            <span className="font-semibold">Manutenção:</span> {selectedClassroom.maintenanceReason || 'Esta sala está em manutenção.'}
                        </p>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {selectedClassroom ? (
                <div className="overflow-x-auto border rounded-lg">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[100px] font-semibold">Turno</TableHead>
                        {DAYS_OF_WEEK.map(day => (
                            <TableHead key={day} className="text-center font-semibold whitespace-nowrap px-2">
                            {day.substring(0,3)}
                            <span className="block text-xs font-normal text-muted-foreground">{getColumnDateString(day, startDate)}</span>
                            </TableHead>
                        ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {PERIODS_OF_DAY.map(shift => (
                        <TableRow key={shift} className="hover:bg-muted/30">
                            <TableCell className="font-semibold bg-muted/50">{shift}</TableCell>
                            {DAYS_OF_WEEK.map(day => {
                            const occupancies = getOccupancyForCell(selectedClassroom.id, day, shift);
                            const isMaintenance = selectedClassroom.isUnderMaintenance;
                            return (
                                <TableCell key={day} className={cn("p-1.5 align-top h-[70px]", isMaintenance && 'bg-amber-50 dark:bg-amber-900/40')}>
                                {isMaintenance ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Wrench className="h-5 w-5 text-amber-500" />
                                    </div>
                                ) : occupancies.length > 0 ? (
                                    <div className="space-y-1">
                                    {occupancies.map((item, index) => (
                                        <OccupancyBadge key={`${item.type}-${('id' in item.data) ? item.data.id : ''}-${index}`} item={item} classGroups={initialClassGroups} />
                                    ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Badge variant="outline" className="text-xs border-dashed bg-transparent text-muted-foreground font-normal">
                                        Livre
                                        </Badge>
                                    </div>
                                )}
                                </TableCell>
                            )
                            })}
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <p className="text-lg font-medium">Nenhuma sala selecionada</p>
                    <p>Escolha uma sala na lista à esquerda para ver sua agenda.</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>
      </div>
  );
}
