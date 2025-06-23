
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, parseISO, isValid, differenceInDays, max as maxDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Wrench } from 'lucide-react';

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

const getCourseColorClasses = (groupName: string | undefined): string => {
  if (!groupName) return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/30 dark:text-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700/50';
  const prefixMatch = groupName.match(/^([A-Z]+)/);
  const prefix = prefixMatch ? prefixMatch[1] : 'DEFAULT';

  switch (prefix) {
    case 'RAD': // Radiologia - Amarelo
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-700/30 dark:text-yellow-200 dark:border-yellow-600 hover:bg-yellow-200 dark:hover:bg-yellow-700/50';
    case 'FMC': // Farmácia - Roxo
      return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-700/30 dark:text-purple-200 dark:border-purple-600 hover:bg-purple-200 dark:hover:bg-purple-700/50';
    case 'ADM': // Administração - Azul
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-700/30 dark:text-blue-200 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-700/50';
    case 'CDI': // Cuidador de Idosos - Rosa
      return 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-700/30 dark:text-pink-200 dark:border-pink-600 hover:bg-pink-200 dark:hover:bg-pink-700/50';
    case 'ENF': // Enfermagem - Azul Céu (mantido)
      return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-700/30 dark:text-sky-200 dark:border-sky-600 hover:bg-sky-200 dark:hover:bg-sky-700/50';
    default: // Outros cursos - Cinza
      return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700/30 dark:text-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700/50';
  }
};

const getColumnDateString = (targetDay: DayOfWeek, currentFilterStartDate: Date | undefined): string => {
  if (!currentFilterStartDate || !isValid(currentFilterStartDate)) return '';
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
      return 'bg-sky-100/70 dark:bg-sky-800/40 hover:bg-sky-200/70 dark:hover:bg-sky-700/50';
    case 'Tarde':
      return 'bg-orange-100/70 dark:bg-orange-800/40 hover:bg-orange-200/70 dark:hover:bg-orange-700/50';
    case 'Noite':
      return 'bg-indigo-100/70 dark:bg-indigo-800/40 hover:bg-indigo-200/70 dark:hover:bg-indigo-700/50';
    default:
      return 'bg-muted/50 dark:bg-muted/30';
  }
};

const getCellContainerClass = (classroomId: string, day: DayOfWeek, displayedClassGroups: ClassGroup[], roomIsUnderMaintenance: boolean): string => {
    if (roomIsUnderMaintenance) {
      return 'bg-amber-100/70 dark:bg-amber-900/40 opacity-70';
    }
    const groupsInCellToday = displayedClassGroups.filter(
      cg => 
        cg.assignedClassroomId === classroomId && 
        Array.isArray(cg.classDays) && cg.classDays.includes(day) && 
        cg.status === 'Em Andamento'
    );
    if (groupsInCellToday.length === 0) return 'bg-background dark:bg-card';

    const endDates = groupsInCellToday
      .map(cg => (typeof cg.endDate === 'string' ? parseISO(cg.endDate) : null))
      .filter(date => date && isValid(date)) as Date[]; // Ensure only valid Dates are kept

    if (endDates.length === 0) return 'bg-muted/30 dark:bg-muted/20'; 

    const latestEndDateInCell = maxDate(endDates);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = differenceInDays(latestEndDateInCell, today);

    if (daysRemaining < 0) return 'bg-background dark:bg-card'; // Turmas já encerradas, célula não deve ter cor de ocupação
    if (daysRemaining <= 7) return 'bg-yellow-100/60 dark:bg-yellow-900/30'; // Perto do fim
    return 'bg-muted/40 dark:bg-muted/20'; // Ocupado normal
};


export default function RoomAvailabilityDisplay({ initialClassrooms, initialClassGroups }: RoomAvailabilityDisplayProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [displayedClassGroups, setDisplayedClassGroups] = useState<ClassGroup[]>([]);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    // This avoids hydration mismatch errors with `new Date()`.
    const initialDate = new Date();
    const weekStart = startOfWeek(initialDate, { weekStartsOn: 1 });
    setStartDate(weekStart);
    setEndDate(addDays(weekStart, 6));
  }, []); // Empty dependency array ensures this runs once after mount.

  const filterClassGroups = React.useCallback(() => {
    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
      setDisplayedClassGroups([]);
      return;
    }
    const filtered = initialClassGroups.filter(cg => {
      if (!cg || typeof cg.startDate !== 'string' || typeof cg.endDate !== 'string' || typeof cg.status !== 'string') {
        // console.warn('Skipping class group due to missing or invalid properties:', cg);
        return false; 
      }
      const cgStartDate = parseISO(cg.startDate);
      const cgEndDate = parseISO(cg.endDate);
      
      if (!isValid(cgStartDate) || !isValid(cgEndDate)) {
        // console.warn('Skipping class group due to invalid date format:', cg);
        return false;
      }
      
      if (cg.status !== 'Em Andamento') {
          return false;
      }
      
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
      Array.isArray(cg.classDays) && cg.classDays.includes(day) &&
      cg.shift === shift && 
      cg.status === 'Em Andamento'
    );
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
                  {startDate && isValid(startDate) ? format(startDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date && isValid(date)) {
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
              {endDate && isValid(endDate) ? format(endDate, "PPP", { locale: ptBR }) : <span>Calculada automaticamente</span>}
            </Button>
          </div>
        </div>

        {initialClassrooms.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma sala cadastrada.</p>
        ) : displayedClassGroups.length === 0 && initialClassrooms.every(c => c.isUnderMaintenance) && (startDate && endDate) ? (
          <p className="text-muted-foreground text-center py-4">Todas as salas estão em manutenção ou nenhuma turma ativa encontrada para o período.</p>
        ) : displayedClassGroups.length === 0 && (startDate && endDate) && !initialClassrooms.some(c => !c.isUnderMaintenance) ? (
           <p className="text-muted-foreground text-center py-4">Todas as salas cadastradas estão em manutenção.</p>
        ) : displayedClassGroups.length === 0 && (startDate && endDate) ? (
           <p className="text-muted-foreground text-center py-4">Nenhuma turma ativa encontrada para o período selecionado em salas disponíveis.</p>
        ) : !startDate || !endDate ? (
          <p className="text-muted-foreground text-center py-4">Por favor, selecione um intervalo de datas.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg shadow-md bg-card">
            <Table className="min-w-full table-fixed">
              <TableHeader className="sticky top-0 z-20 bg-muted/95 dark:bg-muted backdrop-blur-sm shadow-sm">
                <TableRow>
                  <TableHead className="w-[160px] min-w-[160px] sticky top-0 left-0 bg-muted/95 dark:bg-muted z-30 shadow-sm text-sm font-semibold text-foreground border-r px-3 py-3 align-middle">Sala</TableHead>
                  {DAYS_OF_WEEK.map(day => {
                    const columnDateStr = getColumnDateString(day, startDate);
                    return (
                      <TableHead key={day} className="w-[180px] min-w-[180px] text-center whitespace-nowrap text-sm font-semibold text-foreground border-r px-2 py-3 align-middle">
                        {day.substring(0,3)}
                        {columnDateStr && (
                          <>
                            <br />
                            <span className="text-xs font-normal text-muted-foreground">{columnDateStr}</span>
                          </>
                        )}
                      </TableHead>
                    );
                  })}
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
                            {room.maintenanceReason ? (
                              <p>Motivo: {room.maintenanceReason}</p>
                            ) : (
                              <p>Motivo não especificado.</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    {DAYS_OF_WEEK.map(day => {
                      const cellBgClass = getCellContainerClass(room.id, day, displayedClassGroups, room.isUnderMaintenance ?? false);
                      return (
                        <TableCell
                          key={day}
                          className={cn(
                            "align-top p-0.5 transition-colors duration-150 h-[170px] border-r relative", // Adjusted height
                            cellBgClass
                          )}
                        >
                          {room.isUnderMaintenance ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-amber-100/50 dark:bg-amber-800/40 backdrop-blur-xs">
                               <Tooltip delayDuration={150}>
                                <TooltipTrigger asChild>
                                  <div><Wrench className="h-8 w-8 text-amber-500 dark:text-amber-400" /></div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-background text-foreground border shadow-lg rounded-md p-2 text-xs max-w-xs">
                                  <p className="font-semibold mb-1">Em Manutenção</p>
                                  {room.maintenanceReason ? (
                                    <p>Motivo: {room.maintenanceReason}</p>
                                  ) : (
                                    <p>Motivo não especificado.</p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <div className="flex flex-col space-y-0.5 h-full text-xs">
                              {PERIODS_OF_DAY.map(shift => {
                                const scheduledForShift = getScheduledGroupsForShift(room.id, day, shift);
                                const shiftColorClass = getShiftColorClass(shift);
                                return (
                                  <Tooltip key={shift} delayDuration={150}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={cn(
                                          "flex-1 p-1 rounded-sm border border-border/30 shadow-sm transition-all flex flex-col items-center min-h-[55px] hover:shadow-md", 
                                          shiftColorClass,
                                          scheduledForShift.length > 0 ? "justify-start pt-0.5" : "justify-center"
                                        )}
                                      >
                                        {scheduledForShift.length > 0 ? (
                                          <div className="flex flex-col gap-0.5 items-center justify-start w-full">
                                            {scheduledForShift.slice(0, 2).map(cg => (
                                              <Badge
                                                key={cg.id}
                                                variant="secondary"
                                                className={cn(
                                                  "text-[10px] px-1.5 py-0.5 w-full text-left block max-w-full truncate leading-tight border font-medium shadow-xs",
                                                  getCourseColorClasses(cg.name)
                                                )}
                                                title={`${cg.name} (${cg.shift})`}
                                              >
                                                {cg.name}
                                              </Badge>
                                            ))}
                                            {scheduledForShift.length > 2 && (
                                              <Badge variant="outline" className="text-[9px] px-1 mt-0.5 w-full text-center bg-muted/50 dark:bg-muted/70">
                                                +{scheduledForShift.length - 2} turma(s)
                                              </Badge>
                                            )}
                                          </div>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] px-2 py-1 bg-green-100 border-green-400 text-green-800 dark:bg-green-800/40 dark:text-green-200 dark:border-green-600/70 font-semibold shadow-xs"
                                          >
                                            Livre
                                          </Badge>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-background text-foreground border shadow-lg rounded-md p-2 text-xs max-w-xs">
                                      <p className="font-semibold mb-1">{shift}</p>
                                      {scheduledForShift.length > 0 ? (
                                        <ul className="list-disc list-inside space-y-0.5">
                                          {scheduledForShift.map(cg => (
                                            <li key={cg.id} className={getCourseColorClasses(cg.name).replace(/bg-(\w+)-(\d+)/, 'text-$1-800 dark:text-$1-200').replace('border-transparent', '')}>
                                              {cg.name}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p>Este turno está livre.</p>
                                      )}
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
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
        <p className="text-xs text-muted-foreground mt-6">
            Nota: Este quadro reflete a ocupação padrão com base nos dias de aula e turnos das turmas "Em Andamento" no período selecionado. Reservas pontuais e salas em manutenção podem afetar a disponibilidade real.
        </p>
      </div>
    </TooltipProvider>
  );
}
