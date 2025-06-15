
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, parseISO, isValid, differenceInDays, max as maxDate, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Search } from 'lucide-react';

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
import type { Classroom, ClassGroup, DayOfWeek, PeriodOfDay } from '@/types';
import { DAYS_OF_WEEK, PERIODS_OF_DAY } from '@/lib/constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface RoomAvailabilityDisplayProps {
  initialClassrooms: Classroom[];
  initialClassGroups: ClassGroup[];
}

const getCourseColorClasses = (groupName: string): string => {
  const prefixMatch = groupName.match(/^([A-Z]+)/);
  const prefix = prefixMatch ? prefixMatch[1] : 'DEFAULT';

  switch (prefix) {
    case 'ENF':
      return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-700/30 dark:text-sky-200 dark:border-sky-600 hover:bg-sky-200 dark:hover:bg-sky-700/50';
    case 'FMC':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-700/30 dark:text-amber-200 dark:border-amber-600 hover:bg-amber-200 dark:hover:bg-amber-700/50';
    case 'RAD':
      return 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-700/30 dark:text-lime-200 dark:border-lime-600 hover:bg-lime-200 dark:hover:bg-lime-700/50';
    case 'ADM':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-700/30 dark:text-purple-200 dark:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-700/50';
    case 'CDI':
      return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-700/30 dark:text-pink-200 dark:border-pink-600 hover:bg-pink-200 dark:hover:bg-pink-700/50';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/30 dark:text-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700/50';
  }
};

const getColumnDateString = (targetDay: DayOfWeek, currentFilterStartDate: Date | undefined): string => {
  if (!currentFilterStartDate) return '';
  const mondayOfFilterWeek = startOfWeek(currentFilterStartDate, { weekStartsOn: 1 });
  const orderInDAYS_OF_WEEK: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const targetDayIndexInOrder = orderInDAYS_OF_WEEK.indexOf(targetDay);
  if (targetDayIndexInOrder === -1) return '';
  const dateForColumn = addDays(mondayOfFilterWeek, targetDayIndexInOrder);
  return format(dateForColumn, 'dd/MMM', { locale: ptBR });
};

const getShiftColorClass = (shift: PeriodOfDay): string => {
  switch (shift) {
    case 'Manhã':
      return 'bg-sky-200/70 dark:bg-sky-700/40 hover:bg-sky-300/70 dark:hover:bg-sky-600/40';
    case 'Tarde':
      return 'bg-orange-200/70 dark:bg-orange-700/40 hover:bg-orange-300/70 dark:hover:bg-orange-600/40';
    case 'Noite':
      return 'bg-indigo-200/70 dark:bg-indigo-700/40 hover:bg-indigo-300/70 dark:hover:bg-indigo-600/40';
    default:
      return 'bg-muted/50 dark:bg-muted/30';
  }
};

export default function RoomAvailabilityDisplay({ initialClassrooms, initialClassGroups }: RoomAvailabilityDisplayProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6));
  const [displayedClassGroups, setDisplayedClassGroups] = useState<ClassGroup[]>([]);

  const filterClassGroups = React.useCallback(() => {
    if (!startDate || !endDate) {
      setDisplayedClassGroups([]);
      return;
    }
    const filtered = initialClassGroups.filter(cg => {
      const cgStartDate = parseISO(cg.startDate);
      const cgEndDate = parseISO(cg.endDate);
      if (!isValid(cgStartDate) || !isValid(cgEndDate)) return false;
      return cgStartDate <= endDate && cgEndDate >= startDate;
    });
    setDisplayedClassGroups(filtered);
  }, [startDate, endDate, initialClassGroups]);

  useEffect(() => {
    filterClassGroups();
  }, [filterClassGroups]);

  const getScheduledGroupsForShift = (classroomId: string, day: DayOfWeek, shift: PeriodOfDay): ClassGroup[] => {
    return displayedClassGroups.filter(cg =>
      cg.assignedClassroomId === classroomId &&
      cg.classDays.includes(day) &&
      cg.shift === shift &&
      cg.status === 'Em Andamento'
    );
  };

  const getCellOverallStateClass = (classroomId: string, day: DayOfWeek): string => {
    const groupsInCellToday = displayedClassGroups.filter(
      cg => cg.assignedClassroomId === classroomId && cg.classDays.includes(day) && cg.status === 'Em Andamento'
    );
    if (groupsInCellToday.length === 0) return 'bg-background dark:bg-card'; 

    const endDates = groupsInCellToday.map(cg => parseISO(cg.endDate)).filter(date => isValid(date));
    if (endDates.length === 0) return 'bg-muted/20 dark:bg-muted/10';

    const latestEndDateInCell = maxDate(endDates);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = differenceInDays(latestEndDateInCell, today);

    if (daysRemaining < 0) return 'bg-background dark:bg-card'; 
    if (daysRemaining <= 7) return 'bg-yellow-100/70 dark:bg-yellow-900/20';
    if (daysRemaining <= 30) return 'bg-orange-100/70 dark:bg-orange-900/20';
    return 'bg-muted/30 dark:bg-muted/20'; 
  };

  return (
    <TooltipProvider>
      <div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg items-end bg-card">
          <div className="flex-1">
            <label htmlFor="startDateFilter" className="block text-sm font-medium text-foreground mb-1">Data de Início da Semana</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="startDateFilter"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
                      setStartDate(weekStart);
                      setEndDate(addDays(weekStart, 6));
                    } else {
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1">
            <label htmlFor="endDateFilter" className="block text-sm font-medium text-foreground mb-1">Data de Fim da Semana</label>
            <Button
              id="endDateFilter"
              variant={"outline"}
              disabled
              className={cn(
                "w-full justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Calculada automaticamente</span>}
            </Button>
          </div>
        </div>

        {initialClassrooms.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma sala cadastrada.</p>
        ) : displayedClassGroups.length === 0 && (startDate && endDate) ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma turma ativa encontrada para o período selecionado.</p>
        ) : !startDate || !endDate ? (
          <p className="text-muted-foreground text-center py-4">Por favor, selecione um intervalo de datas.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-md bg-card">
            <Table className="min-w-full table-fixed">
              <TableHeader className="sticky top-0 z-20 bg-muted/80 dark:bg-muted backdrop-blur-sm shadow-sm">
                <TableRow>
                  <TableHead className="w-[180px] min-w-[180px] sticky top-0 left-0 bg-muted/80 dark:bg-muted z-30 shadow-sm text-sm font-semibold text-foreground border-r px-3 py-3 align-middle">Sala</TableHead>
                  {DAYS_OF_WEEK.map(day => {
                    const columnDateStr = getColumnDateString(day, startDate);
                    return (
                      <TableHead key={day} className="w-[220px] min-w-[220px] text-center whitespace-nowrap text-sm font-semibold text-foreground border-r px-2 py-3 align-middle">
                        {day}
                        {columnDateStr && (
                          <>
                            <br />
                            <span className="text-xs font-medium text-muted-foreground">{columnDateStr}</span>
                          </>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialClassrooms.map((room: Classroom) => (
                  <TableRow key={room.id} className="hover:bg-card/80 dark:hover:bg-muted/50 transition-colors duration-150">
                    <TableCell className="font-medium sticky left-0 bg-card dark:bg-muted z-10 shadow-sm whitespace-nowrap text-sm py-3 px-3 border-r align-top">
                      {room.name}
                      <span className="block text-xs text-muted-foreground mt-0.5">(Cap: {room.capacity ?? 'N/A'})</span>
                    </TableCell>
                    {DAYS_OF_WEEK.map(day => {
                      const cellBgClass = getCellOverallStateClass(room.id, day);
                      return (
                        <TableCell
                          key={day}
                          className={cn(
                            "align-top p-1 transition-colors duration-150 h-[170px] border-r", 
                            cellBgClass
                          )}
                        >
                          <div className="flex flex-col space-y-1 h-full text-xs">
                            {PERIODS_OF_DAY.map(shift => {
                              const scheduledForShift = getScheduledGroupsForShift(room.id, day, shift);
                              const shiftColor = getShiftColorClass(shift);
                              return (
                                <Tooltip key={shift} delayDuration={100}>
                                  <TooltipTrigger asChild>
                                    <div
                                      title={shift} // HTML native tooltip for basic info
                                      className={cn(
                                        "flex-1 p-2 rounded-md border border-border/50 dark:border-border/30 shadow-sm transition-all flex flex-col items-center justify-center min-h-[50px]",
                                        shiftColor
                                      )}
                                    >
                                      {scheduledForShift.length > 0 ? (
                                        <div className="flex flex-col gap-0.5 items-start justify-center w-full">
                                          {scheduledForShift.map(cg => (
                                            <Badge
                                              key={cg.id}
                                              variant="secondary"
                                              className={cn(
                                                "text-[10px] px-1.5 py-0.5 w-full text-left block max-w-full truncate leading-tight border font-medium",
                                                getCourseColorClasses(cg.name)
                                              )}
                                              title={`${cg.name} (${cg.shift})`}
                                            >
                                              {cg.name}
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] px-1.5 py-0.5 bg-green-100 border-green-400 text-green-800 dark:bg-green-800/30 dark:text-green-200 dark:border-green-600/70 font-semibold"
                                        >
                                          Livre
                                        </Badge>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-background text-foreground border shadow-lg rounded-md p-2 text-xs">
                                    <p>{shift}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-6">
            Nota: Este quadro reflete a ocupação padrão com base nos dias de aula e turnos das turmas ativas no período selecionado. Reservas pontuais não estão incluídas.
        </p>
      </div>
    </TooltipProvider>
  );
}
    

    