
'use server';

import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { ClassroomRecurringReservation, ClassGroup, Classroom, DayOfWeek, PeriodOfDay } from '@/types';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import { z } from 'zod';
import { getClassGroups } from './classgroups';
import { getClassrooms } from './classrooms';
import { parseISO, format, addDays, getDay, isBefore } from 'date-fns';
import { dateRangesOverlap } from '@/lib/utils';
import { DAYS_OF_WEEK } from '../constants';

const dayOfWeekMapping: Record<DayOfWeek, number> = {
  'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
};

// Helper function to calculate the end date based on number of classes and class days
function calculateEndDate(startDate: Date, classDays: DayOfWeek[], numberOfClasses: number): Date {
  const numericalClassDays = classDays.map(d => dayOfWeekMapping[d]);
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0); // Normalize time
  let classesCount = 0;
  let lastClassDate = new Date(currentDate);

  if (numberOfClasses <= 0) {
    return lastClassDate;
  }
  
  // Infinite loop safeguard
  let loop_guard = 0;
  const max_days_to_check = 365 * 2; // Check up to 2 years out

  // Find the very first class date (can be the start date itself or a future date)
  while (!numericalClassDays.includes(getDay(currentDate)) && loop_guard < max_days_to_check) {
    currentDate = addDays(currentDate, 1);
    loop_guard++;
  }
  
  lastClassDate = new Date(currentDate);
  classesCount = 1;

  while (classesCount < numberOfClasses && loop_guard < max_days_to_check) {
    currentDate = addDays(currentDate, 1);
    if (numericalClassDays.includes(getDay(currentDate))) {
      classesCount++;
      lastClassDate = new Date(currentDate);
    }
    loop_guard++;
  }

  return lastClassDate;
}

export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
  try {
    return await readData<ClassroomRecurringReservation>('recurring_reservations.json');
  } catch (error) {
    console.error('Failed to get recurring reservations:', error);
    return [];
  }
}

export async function createRecurringReservation(values: RecurringReservationFormValues) {
  try {
    const validatedValues = recurringReservationFormSchema.parse(values);
    
    const allClassGroups = await getClassGroups();
    const allClassrooms = await getClassrooms();
    const existingReservations = await getRecurringReservations();

    const newReservationClassGroup = allClassGroups.find(cg => cg.id === validatedValues.classGroupId);
    if (!newReservationClassGroup) {
      return { success: false, message: 'Turma da nova reserva não encontrada.' };
    }
    const newReservationClassDays = newReservationClassGroup.classDays;
    
    let newResStartDate: Date;
    try {
        newResStartDate = parseISO(validatedValues.startDate);
        if (isNaN(newResStartDate.getTime())) {
            return { success: false, message: 'Data de início da nova reserva inválida.'};
        }
    } catch (e) {
        return { success: false, message: 'Formato de data de início da nova reserva inválido.'};
    }
    
    const newResEndDate = calculateEndDate(newResStartDate, newReservationClassDays, validatedValues.numberOfClasses);

    for (const existingRes of existingReservations) {
      if (existingRes.classroomId !== validatedValues.classroomId) {
        continue;
      }

      let existingResStartDate: Date, existingResEndDate: Date;
      try {
        existingResStartDate = parseISO(existingRes.startDate);
        existingResEndDate = parseISO(existingRes.endDate);
        if (isNaN(existingResStartDate.getTime()) || isNaN(existingResEndDate.getTime())) {
            console.warn(`Reserva existente ${existingRes.id} tem datas inválidas. Pulando.`);
            continue;
        }
      } catch(e) {
        console.warn(`Reserva existente ${existingRes.id} tem formato de data inválido. Pulando.`);
        continue;
      }
      

      if (!dateRangesOverlap(newResStartDate, newResEndDate, existingResStartDate, existingResEndDate)) {
        continue;
      }
      
      if (existingRes.shift !== validatedValues.shift) {
        continue;
      }

      const existingResClassGroup = allClassGroups.find(cg => cg.id === existingRes.classGroupId);
      if (!existingResClassGroup) {
        console.warn(`Turma ${existingRes.classGroupId} da reserva existente ${existingRes.id} não encontrada. Pulando checagem de conflito para esta reserva.`);
        continue;
      }
      const existingReservationClassDays = existingResClassGroup.classDays;

      const commonClassDays = newReservationClassDays.filter(day => Array.isArray(existingReservationClassDays) && existingReservationClassDays.includes(day));

      if (commonClassDays.length > 0) {
          const conflictingClassroomName = allClassrooms.find(c => c.id === validatedValues.classroomId)?.name || validatedValues.classroomId;
          const conflictingTurmaName = existingResClassGroup.name;
          const formattedCommonDays = commonClassDays.join(', ');
          
          return {
            success: false,
            message: `Conflito: A sala "${conflictingClassroomName}" já está reservada para a turma "${conflictingTurmaName}" no turno da "${validatedValues.shift}" nos dias de (${formattedCommonDays}) durante o período de ${format(existingResStartDate, 'dd/MM/yyyy')} a ${format(existingResEndDate, 'dd/MM/yyyy')} ou parte dele.`,
          };
      }
    }

    const newReservation: ClassroomRecurringReservation = {
      id: generateId(),
      classGroupId: validatedValues.classGroupId,
      classroomId: validatedValues.classroomId,
      startDate: validatedValues.startDate, 
      endDate: format(newResEndDate, 'yyyy-MM-dd'),
      shift: validatedValues.shift as PeriodOfDay,
      purpose: validatedValues.purpose,
    };

    existingReservations.push(newReservation);
    await writeData('recurring_reservations.json', existingReservations);

    revalidatePath('/reservations');
    revalidatePath('/room-availability'); 
    return { success: true, message: 'Reserva recorrente criada com sucesso!', data: newReservation };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao criar reserva recorrente.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create recurring reservation:', error);
    if (error instanceof Error && error.message.includes("date provided to dateRangesOverlap")) {
        return { success: false, message: `Erro interno com datas: ${error.message}` };
    }
    if (error instanceof Error && error.message.includes("is after end date for the")) {
        return { success: false, message: `Erro interno com intervalo de datas: ${error.message}` };
    }
    return { success: false, message: 'Erro interno ao criar reserva recorrente.' };
  }
}

export async function deleteRecurringReservation(id: string) {
  try {
    let reservations = await getRecurringReservations();
    const reservationIndex = reservations.findIndex(r => r.id === id);

    if (reservationIndex === -1) {
        return { success: false, message: 'Reserva recorrente não encontrada para exclusão.' };
    }
    
    reservations.splice(reservationIndex, 1);
    await writeData('recurring_reservations.json', reservations);

    revalidatePath('/reservations');
    revalidatePath('/room-availability'); 
    return { success: true, message: 'Reserva recorrente excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete recurring reservation ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir reserva recorrente.' };
  }
}
