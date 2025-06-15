
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { EventReservation, ClassroomRecurringReservation, ClassGroup, Classroom } from '@/types';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import { getRecurringReservations } from './recurring_reservations';
import { getClassGroups } from './classgroups';
import { getClassrooms } from './classrooms'; // To get classroom names for messages
import { parseISO, getDay, format } from 'date-fns';
import { SHIFT_TIME_RANGES, JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';

// Helper to check if two time ranges overlap (HH:mm strings)
function timeRangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const toMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const startAMin = toMinutes(startA);
  const endAMin = toMinutes(endA);
  const startBMin = toMinutes(startB);
  const endBMin = toMinutes(endB);
  return startAMin < endBMin && endAMin > startBMin;
}

export async function getEventReservations(): Promise<EventReservation[]> {
  return await readData<EventReservation>('event_reservations.json');
}

export async function createEventReservation(values: EventReservationFormValues) {
  try {
    const validatedValues = eventReservationFormSchema.parse(values);

    const existingEventReservations = await getEventReservations();
    const existingRecurringReservations = await getRecurringReservations();
    const allClassGroups = await getClassGroups();
    const allClassrooms = await getClassrooms(); // For richer error messages

    const newEventDate = parseISO(validatedValues.date);
    const newEventDayOfWeekJs = getDay(newEventDate); // 0 for Sunday, 1 for Monday...
    const newEventDayOfWeekPt = JS_DAYS_OF_WEEK_MAP_TO_PT[newEventDayOfWeekJs];


    // 1. Check conflict with other EventReservations
    for (const existingEvent of existingEventReservations) {
      if (existingEvent.classroomId === validatedValues.classroomId && existingEvent.date === validatedValues.date) {
        if (timeRangesOverlap(validatedValues.startTime, validatedValues.endTime, existingEvent.startTime, existingEvent.endTime)) {
          const classroomName = allClassrooms.find(c => c.id === validatedValues.classroomId)?.name || validatedValues.classroomId;
          return { 
            success: false, 
            message: `Conflito: A sala "${classroomName}" já está reservada para o evento "${existingEvent.title}" neste dia e horário (${existingEvent.startTime} - ${existingEvent.endTime}).` 
          };
        }
      }
    }

    // 2. Check conflict with ClassroomRecurringReservations
    for (const recurringRes of existingRecurringReservations) {
      if (recurringRes.classroomId !== validatedValues.classroomId) {
        continue;
      }

      const recurringStartDate = parseISO(recurringRes.startDate);
      const recurringEndDate = parseISO(recurringRes.endDate);

      // Check if the new event date is within the recurring reservation's date range
      if (newEventDate >= recurringStartDate && newEventDate <= recurringEndDate) {
        const classGroup = allClassGroups.find(cg => cg.id === recurringRes.classGroupId);
        if (classGroup && classGroup.classDays.includes(newEventDayOfWeekPt)) {
          // The recurring reservation is active on this day of the week.
          // Now check if the event's time overlaps with the recurring reservation's shift.
          const shiftTimeRange = SHIFT_TIME_RANGES[recurringRes.shift];
          if (timeRangesOverlap(validatedValues.startTime, validatedValues.endTime, shiftTimeRange.start, shiftTimeRange.end)) {
            const classroomName = allClassrooms.find(c => c.id === validatedValues.classroomId)?.name || validatedValues.classroomId;
            const turmaName = classGroup.name;
            return { 
              success: false, 
              message: `Conflito: A sala "${classroomName}" tem uma reserva recorrente para a turma "${turmaName}" no turno da "${recurringRes.shift}" (${newEventDayOfWeekPt}) que coincide com o horário deste evento.`
            };
          }
        }
      }
    }

    const newEventReservation: EventReservation = {
      id: generateId(),
      ...validatedValues,
    };

    existingEventReservations.push(newEventReservation);
    await writeData<EventReservation>('event_reservations.json', existingEventReservations);

    revalidatePath('/reservations');
    revalidatePath('/room-availability'); // Also revalidate availability page
    return { success: true, message: 'Reserva de evento criada com sucesso!', data: newEventReservation };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create event reservation:', error);
    return { success: false, message: 'Erro ao criar reserva de evento. Verifique o console para mais detalhes.' };
  }
}

export async function deleteEventReservation(id: string) {
  try {
    let eventReservations = await getEventReservations();
    eventReservations = eventReservations.filter(er => er.id !== id);
    await writeData<EventReservation>('event_reservations.json', eventReservations);
    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento excluída com sucesso!' };
  } catch (error) {
    console.error('Failed to delete event reservation:', error);
    return { success: false, message: 'Erro ao excluir reserva de evento.' };
  }
}
