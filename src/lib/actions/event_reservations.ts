
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { EventReservation } from '@/types';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import { getRecurringReservations } from './recurring_reservations';
import { getClassGroups } from './classgroups';
import { getClassrooms } from './classrooms';
import { parseISO, getDay } from 'date-fns';
import { SHIFT_TIME_RANGES, JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';

// Helper function to convert HH:mm string to total minutes from midnight
const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
        throw new Error(`Invalid time string format: ${timeStr}`);
    }
    return hours * 60 + minutes;
};

// Helper function to check if two time ranges overlap
const timeRangesOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
    try {
        const startAMinutes = timeToMinutes(startA);
        const endAMinutes = timeToMinutes(endA);
        const startBMinutes = timeToMinutes(startB);
        const endBMinutes = timeToMinutes(endB);

        if (startAMinutes >= endAMinutes) {
            throw new Error(`Start time ${startA} is not before end time ${endA}`);
        }
        if (startBMinutes >= endBMinutes) {
            throw new Error(`Start time ${startB} is not before end time ${endB}`);
        }

        // Overlap occurs if one range starts before the other ends, and vice-versa
        return startAMinutes < endBMinutes && startBMinutes < endAMinutes;
    } catch (error) {
        console.error("Error in timeRangesOverlap:", error);
        // Decide how to handle invalid time formats. Returning false is a safe default.
        // Or rethrow the error if the inputs should always be valid.
        throw error;
    }
};

export async function getEventReservations(): Promise<EventReservation[]> {
  try {
    return await readData<EventReservation>('event_reservations.json');
  } catch (error) {
    console.error('Failed to get event reservations:', error);
    return [];
  }
}

export async function createEventReservation(values: EventReservationFormValues) {
  try {
    const validatedValues = eventReservationFormSchema.parse(values);

    const existingEventReservations = await getEventReservations();
    const existingRecurringReservations = await getRecurringReservations();
    const allClassGroups = await getClassGroups();
    const allClassrooms = await getClassrooms();

    const newEventDate = parseISO(validatedValues.date);
    if (!newEventDate || isNaN(newEventDate.getTime())) {
        return { success: false, message: 'Data do evento inválida.'};
    }
    const newEventDayOfWeekJs = getDay(newEventDate);
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
      if (isNaN(recurringStartDate.getTime()) || isNaN(recurringEndDate.getTime())) continue;


      if (newEventDate >= recurringStartDate && newEventDate <= recurringEndDate) {
        const classGroup = allClassGroups.find(cg => cg.id === recurringRes.classGroupId);
        if (classGroup && Array.isArray(classGroup.classDays) && classGroup.classDays.includes(newEventDayOfWeekPt)) {
          const shiftTimeRange = SHIFT_TIME_RANGES[recurringRes.shift];
          if (timeRangesOverlap(validatedValues.startTime, validatedValues.endTime, shiftTimeRange.start, shiftTimeRange.end)) {
            const classroomName = allClassrooms.find(c => c.id === validatedValues.classroomId)?.name || validatedValues.classroomId;
            const turmaName = classGroup.name;
            return {
              success: false,
              message: `Conflito: A sala "${classroomName}" tem uma reserva recorrente para a turma "${turmaName}" no turno da "${recurringRes.shift}" (${newEventDayOfWeekPt}, ${shiftTimeRange.start}-${shiftTimeRange.end}) que coincide com o horário deste evento.`
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
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento criada com sucesso!', data: newEventReservation };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao criar reserva de evento.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create event reservation:', error);
    // Check if the error is from timeRangesOverlap due to invalid time format
    if (error instanceof Error && error.message.startsWith('Invalid time string format')) {
        return { success: false, message: `Formato de hora inválido para a reserva do evento: ${error.message}` };
    }
    if (error instanceof Error && error.message.includes('is not before end time')) {
        return { success: false, message: `Lógica de horários inválida: ${error.message}` };
    }
    return { success: false, message: 'Erro interno ao criar reserva de evento.' };
  }
}

export async function deleteEventReservation(id: string) {
  try {
    const eventReservations = await getEventReservations();
    const reservationIndex = eventReservations.findIndex(er => er.id === id);

    if (reservationIndex === -1) {
      return { success: false, message: 'Reserva de evento não encontrada para exclusão.' };
    }

    eventReservations.splice(reservationIndex, 1);
    await writeData<EventReservation>('event_reservations.json', eventReservations);

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete event reservation ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir reserva de evento.' };
  }
}
