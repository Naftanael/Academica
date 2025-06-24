
'use server';

import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { ClassroomRecurringReservation, ClassGroup, Classroom, DayOfWeek, PeriodOfDay } from '@/types';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import { z } from 'zod';
import { getClassGroups } from './classgroups';
import { getClassrooms } from './classrooms';
import { parseISO, format } from 'date-fns';
import { dateRangesOverlap } from '@/lib/utils';

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
    
    let newResStartDate: Date, newResEndDate: Date;
    try {
        newResStartDate = parseISO(validatedValues.startDate);
        newResEndDate = parseISO(validatedValues.endDate);
        if (isNaN(newResStartDate.getTime()) || isNaN(newResEndDate.getTime())) {
            return { success: false, message: 'Datas da nova reserva inválidas.'};
        }
    } catch (e) {
        return { success: false, message: 'Formato de data da nova reserva inválido.'};
    }


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
      endDate: validatedValues.endDate,     
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
