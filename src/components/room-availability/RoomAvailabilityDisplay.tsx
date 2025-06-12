
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, parseISO, isValid, differenceInDays, max as maxDate } from 'date-fns';
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

export default function RoomAvailabilityDisplay({ initialClassrooms, initialClassGroups }: RoomAvailabilityDisplayProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
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

      // Class group is active if its period overlaps with the selected filter period
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
      cg.shift === shift
    );
  };

  const getCellBackgroundColor = (classroomId: string, day: DayOfWeek): string => {
    const groupsInCellToday = displayedClassGroups.filter(
      cg => cg.assignedClassroomId === classroomId && cg.classDays.includes(day)
    );

    if (groupsInCellToday.length === 0) {
      return 'bg-green-50 dark:bg-green-800/30'; // Livre
    }

    const endDates = groupsInCellToday
      .map(cg => parseISO(cg.endDate))
      .filter(date => isValid(date));
    
    if (endDates.length === 0) { // Should not happen if groupsInCellToday is not empty
      return 'bg-green-50 dark:bg-green-800/30';
    }

    const latestEndDateInCell = maxDate(endDates);
    const daysRemaining = differenceInDays(latestEndDateInCell, new Date());

    if (daysRemaining < 0) { // All groups have finished
      return 'bg-green-50 dark:bg-green-800/30';
    }
    if (daysRemaining <= 7) {
      return 'bg-yellow-100 dark:bg-yellow-700/40'; // Libera em <= 7 dias
    }
    if (daysRemaining <= 30) {
      return 'bg-orange-100 dark:bg-orange-700/40'; // Libera entre 8 e 30 dias
    }
    return 'bg-red-100 dark:bg-red-700/40'; // Libera em > 30 dias
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg items-end bg-muted/50">
        <div className="flex-1">
          <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">Data de Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="startDate"
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
                onSelect={setStartDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex-1">
          <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">Data de Fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="endDate"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                locale={ptBR}
                disabled={(date) => startDate && date < startDate}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button onClick={filterClassGroups} className="w-full sm:w-auto">
          <Search className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
      </div>

      {initialClassrooms.length === 0 ? (
         <p className="text-muted-foreground text-center py-4">Nenhuma sala cadastrada.</p>
      ) : displayedClassGroups.length === 0 && (startDate && endDate) ? (
         <p className="text-muted-foreground text-center py-4">Nenhuma turma ativa encontrada para o período selecionado.</p>
      ) : !startDate || !endDate ? (
         <p className="text-muted-foreground text-center py-4">Por favor, selecione um intervalo de datas e clique em Filtrar.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 z-20 bg-muted/80 dark:bg-muted backdrop-blur-sm">
              <TableRow>
                <TableHead className="min-w-[150px] w-[150px] sticky top-0 left-0 bg-muted/80 dark:bg-muted z-30 shadow-sm text-sm font-semibold text-foreground">Sala</TableHead>
                {DAYS_OF_WEEK.map(day => (
                  <TableHead key={day} className="min-w-[220px] text-center whitespace-nowrap text-sm font-semibold text-foreground">{day}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialClassrooms.map((room: Classroom) => (
                <TableRow key={room.id} className="hover:bg-muted/20 transition-colors duration-150">
                  <TableCell className="font-medium sticky left-0 bg-card dark:bg-background z-10 shadow-sm whitespace-nowrap text-sm py-3 px-2">
                    {room.name}
                    <span className="block text-xs text-muted-foreground mt-0.5">({room.capacity} lugares)</span>
                  </TableCell>
                  {DAYS_OF_WEEK.map(day => {
                    const cellBgClass = getCellBackgroundColor(room.id, day);
                    return (
                      <TableCell 
                        key={day} 
                        className={cn(
                          "align-top p-2 transition-colors duration-150 h-[160px]", 
                          cellBgClass
                        )}
                      >
                        <div className="flex flex-col space-y-1.5 h-full">
                          {PERIODS_OF_DAY.map(shift => {
                            const scheduledForShift = getScheduledGroupsForShift(room.id, day, shift);
                            return (
                              <div key={shift} className="text-xs">
                                <p className="font-semibold text-foreground/80 mb-0.5">{shift}:</p>
                                {scheduledForShift.length > 0 ? (
                                  <div className="flex flex-col gap-0.5 items-start">
                                    {scheduledForShift.map(cg => (
                                      <Badge 
                                        key={cg.id} 
                                        variant="secondary" 
                                        className="text-xs px-1.5 py-0.5 w-full text-left block max-w-full truncate leading-tight"
                                        title={`${cg.name}`}
                                      >
                                        {cg.name}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-green-700 dark:text-green-300 font-semibold">Livre</span>
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

