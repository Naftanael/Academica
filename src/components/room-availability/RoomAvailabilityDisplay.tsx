
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

interface RoomAvailabilityDisplayProps {
  initialClassrooms: Classroom[];
  initialClassGroups: ClassGroup[];
}

// Helper function to get color classes based on course prefix
const getCourseColorClasses = (groupName: string): string => {
  const prefixMatch = groupName.match(/^([A-Z]+)/);
  const prefix = prefixMatch ? prefixMatch[1] : 'DEFAULT';

  switch (prefix) {
    case 'ENF':
      return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-700/30 dark:text-sky-200 dark:border-sky-600';
    case 'FMC':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-700/30 dark:text-amber-200 dark:border-amber-600';
    case 'RAD':
      return 'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-700/30 dark:text-lime-200 dark:border-lime-600';
    case 'ADM':
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-700/30 dark:text-purple-200 dark:border-purple-600';
    case 'CDI':
      return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-700/30 dark:text-pink-200 dark:border-pink-600';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/30 dark:text-slate-200 dark:border-slate-600';
  }
};

// Helper to get formatted date string for header
const getColumnDateString = (targetDay: DayOfWeek, currentFilterStartDate: Date | undefined): string => {
  if (!currentFilterStartDate) return '';

  const mondayOfFilterWeek = startOfWeek(currentFilterStartDate, { weekStartsOn: 1 }); // 1 for Monday

  const orderInDAYS_OF_WEEK: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const targetDayIndexInOrder = orderInDAYS_OF_WEEK.indexOf(targetDay);

  if (targetDayIndexInOrder === -1) return ''; 

  const daysToAdd = targetDayIndexInOrder;
  const dateForColumn = addDays(mondayOfFilterWeek, daysToAdd);
  return format(dateForColumn, 'dd/MMM', { locale: ptBR });
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

      // Check if the class group's active period overlaps with the selected filter period
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
      cg.status === 'Em Andamento' // Consider only active class groups for occupancy
    );
  };

  // Determines the background of the entire TableCell based on classes ending soon in that day/room
  const getCellBackgroundColor = (classroomId: string, day: DayOfWeek): string => {
    const groupsInCellToday = displayedClassGroups.filter(
      cg => cg.assignedClassroomId === classroomId && cg.classDays.includes(day) && cg.status === 'Em Andamento'
    );

    if (groupsInCellToday.length === 0) {
      // If completely free for the day, use a neutral or slightly positive background
      return 'bg-background dark:bg-background'; // Or a very light green
    }

    const endDates = groupsInCellToday
      .map(cg => parseISO(cg.endDate))
      .filter(date => isValid(date));
    
    if (endDates.length === 0) { 
      return 'bg-background dark:bg-background';
    }

    const latestEndDateInCell = maxDate(endDates);
    const today = new Date();
    today.setHours(0,0,0,0); // Normalize today's date for comparison

    const daysRemaining = differenceInDays(latestEndDateInCell, today);

    if (daysRemaining < 0) { 
      return 'bg-background dark:bg-background'; // Ended in the past, treat as neutral
    }
    if (daysRemaining <= 7) { // Ending within a week
      return 'bg-yellow-100 dark:bg-yellow-700/20'; 
    }
    if (daysRemaining <= 30) { // Ending within a month
      return 'bg-orange-100 dark:bg-orange-700/20'; 
    }
    // Occupied but not ending soon
    return 'bg-red-50 dark:bg-red-800/10'; 
  };


  return (
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
        <div className="overflow-x-auto border rounded-lg shadow-md">
          <Table className="min-w-full table-fixed">
            <TableHeader className="sticky top-0 z-20 bg-muted/80 dark:bg-muted backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[180px] min-w-[180px] sticky top-0 left-0 bg-muted/80 dark:bg-muted z-30 shadow-sm text-sm font-semibold text-foreground border-r px-3 py-3">Sala</TableHead>
                {DAYS_OF_WEEK.map(day => {
                  const columnDateStr = getColumnDateString(day, startDate);
                  return (
                    <TableHead key={day} className="w-[220px] min-w-[220px] text-center whitespace-nowrap text-sm font-semibold text-foreground border-r px-2 py-3">
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
                <TableRow key={room.id} className="hover:bg-card/50 transition-colors duration-150">
                  <TableCell className="font-medium sticky left-0 bg-card dark:bg-muted z-10 shadow-sm whitespace-nowrap text-sm py-3 px-3 border-r align-top">
                    {room.name}
                    <span className="block text-xs text-muted-foreground mt-0.5">(Cap: {room.capacity ?? 'N/A'})</span>
                  </TableCell>
                  {DAYS_OF_WEEK.map(day => {
                    const cellBgClass = getCellBackgroundColor(room.id, day);
                    return (
                      <TableCell 
                        key={day} 
                        className={cn(
                          "align-top p-1.5 transition-colors duration-150 h-[170px] border-r", // Increased height
                          cellBgClass
                        )}
                      >
                        <div className="flex flex-col space-y-1.5 h-full text-xs">
                          {PERIODS_OF_DAY.map(shift => {
                            const scheduledForShift = getScheduledGroupsForShift(room.id, day, shift);
                            return (
                              <div key={shift} className="flex-1 p-1 rounded-sm min-h-[50px] flex flex-col justify-between border border-transparent hover:border-border/50">
                                <div
                                  className={cn(
                                    "h-2 w-full rounded-t-sm mb-1 shadow-inner", 
                                    shift === 'Manhã' ? 'bg-sky-500' :
                                    shift === 'Tarde' ? 'bg-orange-500' :
                                    shift === 'Noite' ? 'bg-indigo-600' : ''
                                  )}
                                  title={shift}
                                ></div>
                                {scheduledForShift.length > 0 ? (
                                  <div className="flex flex-col gap-0.5 items-start flex-grow">
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
                                  <div className="flex-grow flex items-center justify-center">
                                    <Badge 
                                        variant="outline" 
                                        className="text-[10px] px-1.5 py-0.5 bg-green-100 border-green-300 text-green-800 dark:bg-green-700/30 dark:text-green-200 dark:border-green-600 font-semibold"
                                    >
                                      Livre
                                    </Badge>
                                  </div>
                                )}
                              </div>
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
    </div>
  );
}

