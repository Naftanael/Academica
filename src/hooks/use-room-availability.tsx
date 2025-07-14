
'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, parse, isValid, isWithinInterval, getDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { Classroom, ClassGroup, EventReservation, ClassroomRecurringReservation, OccupancyItem, PeriodOfDay } from '@/types';
import { timeRangesOverlap } from '@/lib/utils';
import { PERIODS_OF_DAY, JS_DAYS_OF_WEEK_MAP_TO_PT, SHIFT_TIME_RANGES } from '@/lib/constants';

export function useRoomAvailability(
  initialClassrooms: Classroom[],
  initialClassGroups: ClassGroup[],
  initialEventReservations: EventReservation[],
  initialRecurringReservations: ClassroomRecurringReservation[],
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [date, setDate] = useState<Date | undefined>(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsedDate = parse(dateParam, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    }
    return new Date();
  });
  
  // Update URL when date changes
  useEffect(() => {
    const newDate = date ? format(date, 'yyyy-MM-dd') : '';
    const currentSearch = new URLSearchParams(searchParams.toString());
    
    if (newDate) {
      currentSearch.set('date', newDate);
    } else {
      currentSearch.delete('date');
    }
    
    // Using setTimeout to debounce the update and avoid replacing history state too often
    const timer = setTimeout(() => {
      router.replace(`${pathname}?${currentSearch.toString()}`, { scroll: false });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);

  }, [date, pathname, router, searchParams]);

  const dailyOccupancy = useMemo(() => {
    if (!date) return new Map<string, OccupancyItem[]>();

    const dailySchedule = new Map<string, OccupancyItem[]>();
    
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

  const getOccupancyForCell = useMemo(() => {
    return (classroomId: string, shift: PeriodOfDay) => {
      const classroom = initialClassrooms.find(cr => cr.id === classroomId);
      if (classroom?.isUnderMaintenance) {
        return { status: 'Manutenção' as const, details: [] };
      }
      const key = `${classroomId}-${shift}`;
      const details = dailyOccupancy.get(key) || [];
      return {
        status: (details.length > 0 ? 'Ocupada' : 'Livre') as 'Ocupada' | 'Livre',
        details
      };
    };
  }, [dailyOccupancy, initialClassrooms]);

  return { date, setDate, getOccupancyForCell, format, ptBR };
}
