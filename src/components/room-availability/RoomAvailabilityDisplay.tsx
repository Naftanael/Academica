
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
import type { Classroom, ClassGroup, DayOfWeek } from '@/types';
import { DAYS_OF_WEEK } from '@/lib/constants';

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

      return cgStartDate <= endDate && cgEndDate >= startDate;
    });
    setDisplayedClassGroups(filtered);
  }, [startDate, endDate, initialClassGroups]);

  useEffect(() => {
    filterClassGroups();
  }, [filterClassGroups]);


  const getScheduledGroups = (classroomId: string, day: DayOfWeek): ClassGroup[] => {
    return displayedClassGroups.filter(cg => 
      cg.assignedClassroomId === classroomId && 
      cg.classDays.includes(day)
    );
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
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="min-w-[180px] sticky left-0 bg-muted/50 z-10 shadow-sm">Sala</TableHead>
                {DAYS_OF_WEEK.map(day => (
                  <TableHead key={day} className="min-w-[200px] text-center whitespace-nowrap">{day}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialClassrooms.map((room: Classroom) => (
                <TableRow key={room.id} className="hover:bg-muted/20 transition-colors duration-150">
                  <TableCell className="font-medium sticky left-0 bg-card z-10 shadow-sm whitespace-nowrap">
                    {room.name}
                    <span className="text-xs text-muted-foreground ml-2">({room.capacity} lugares)</span>
                  </TableCell>
                  {DAYS_OF_WEEK.map(day => {
                    const scheduled = getScheduledGroups(room.id, day);
                    let cellBgClass = 'bg-green-50 dark:bg-green-700/20'; // Default to "Livre" style

                    if (scheduled.length > 0) {
                      const endDates = scheduled
                        .map(cg => parseISO(cg.endDate))
                        .filter(date => isValid(date));
                      
                      if (endDates.length > 0) {
                        const latestEndDate = maxDate(endDates);
                        const daysRemaining = differenceInDays(latestEndDate, new Date());

                        if (daysRemaining >= 0) {
                          if (daysRemaining <= 7) {
                            cellBgClass = 'bg-yellow-100 dark:bg-yellow-600/30'; 
                          } else if (daysRemaining <= 30) {
                            cellBgClass = 'bg-orange-100 dark:bg-orange-600/30';
                          } else {
                            cellBgClass = 'bg-red-100 dark:bg-red-600/30';
                          }
                        }
                        // If daysRemaining < 0, it keeps the default "Livre" (green) style,
                        // indicating the slot is now free from these past groups.
                      }
                    }

                    return (
                      <TableCell 
                        key={day} 
                        className={cn(
                          "text-center align-top p-2 h-[60px] transition-colors duration-150",
                          cellBgClass
                        )}
                      >
                        {scheduled.length > 0 ? (
                          <div className="flex flex-col gap-1.5 items-center justify-center h-full">
                            {scheduled.map(cg => (
                              <Badge 
                                key={cg.id} 
                                variant="secondary" 
                                className="text-xs px-2 py-1 w-full text-center block max-w-[180px] truncate"
                                title={`${cg.name} (${cg.shift})`}
                              >
                                {cg.name} ({cg.shift})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-green-700 dark:text-green-300 flex items-center justify-center h-full">Livre</span>
                        )}
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
