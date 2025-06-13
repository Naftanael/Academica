
'use server';

import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { ClassroomRecurringReservation, ClassGroup, Classroom, DayOfWeek } from '@/types';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import { z } from 'zod';
import { getClassGroups } from './classgroups';
import { getClassrooms } from './classrooms';
import { parseISO, isWithinInterval, format } from 'date-fns';

export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
  return await readData<ClassroomRecurringReservation>('recurring_reservations.json');
}

// Helper function to check if two date ranges overlap
const dateRangesOverlap = (startA: Date, endA: Date, startB: Date, endB: Date): boolean => {
  return startA <= endB && endA >= startB;
};

// Helper function to check if two time strings (HH:mm) overlap
const timeStringsOverlap = (startA: string, endA: string, startB: string, endB: string): boolean => {
  return startA < endB && endA > startB;
};

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
    const newResStartDate = parseISO(validatedValues.startDate);
    const newResEndDate = parseISO(validatedValues.endDate);

    for (const existingRes of existingReservations) {
      // 1. Check for same classroom
      if (existingRes.classroomId !== validatedValues.classroomId) {
        continue;
      }

      // 2. Check for date range overlap
      const existingResStartDate = parseISO(existingRes.startDate);
      const existingResEndDate = parseISO(existingRes.endDate);

      if (!dateRangesOverlap(newResStartDate, newResEndDate, existingResStartDate, existingResEndDate)) {
        continue;
      }

      // 3. Check for common class days and time overlap
      const existingResClassGroup = allClassGroups.find(cg => cg.id === existingRes.classGroupId);
      if (!existingResClassGroup) {
        // This case should ideally not happen if data integrity is maintained
        console.warn(`Turma ${existingRes.classGroupId} da reserva existente ${existingRes.id} não encontrada. Pulando checagem de conflito para esta reserva.`);
        continue;
      }
      const existingReservationClassDays = existingResClassGroup.classDays;

      const commonClassDays = newReservationClassDays.filter(day => existingReservationClassDays.includes(day));

      if (commonClassDays.length > 0) {
        if (timeStringsOverlap(validatedValues.startTime, validatedValues.endTime, existingRes.startTime, existingRes.endTime)) {
          // CONFLICT!
          const conflictingClassroomName = allClassrooms.find(c => c.id === validatedValues.classroomId)?.name || validatedValues.classroomId;
          const conflictingTurmaName = existingResClassGroup.name;
          const formattedCommonDays = commonClassDays.join(', ');
          
          return {
            success: false,
            message: `Conflito de agendamento: A sala "${conflictingClassroomName}" já está reservada para a turma "${conflictingTurmaName}" nos dias de (${formattedCommonDays}) entre ${existingRes.startTime} e ${existingRes.endTime} durante o período de ${format(existingResStartDate, 'dd/MM/yyyy')} a ${format(existingResEndDate, 'dd/MM/yyyy')} ou parte dele.`,
          };
        }
      }
    }

    // If no conflicts, proceed to create the reservation
    const newReservation: ClassroomRecurringReservation = {
      id: generateId(),
      classGroupId: validatedValues.classGroupId,
      classroomId: validatedValues.classroomId,
      startDate: validatedValues.startDate, // Store as YYYY-MM-DD string
      endDate: validatedValues.endDate,     // Store as YYYY-MM-DD string
      startTime: validatedValues.startTime,
      endTime: validatedValues.endTime,
      purpose: validatedValues.purpose,
    };

    existingReservations.push(newReservation);
    await writeData('recurring_reservations.json', existingReservations);

    revalidatePath('/reservations');
    revalidatePath('/room-availability'); // Revalidate availability page
    return { success: true, message: 'Reserva recorrente criada com sucesso!', data: newReservation };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create recurring reservation:', error);
    return { success: false, message: 'Erro ao criar reserva recorrente. Verifique o console.' };
  }
}

export async function deleteRecurringReservation(id: string) {
  try {
    let reservations = await getRecurringReservations();
    reservations = reservations.filter(r => r.id !== id);
    await writeData('recurring_reservations.json', reservations);
    revalidatePath('/reservations');
    revalidatePath('/room-availability'); // Revalidate availability page
    return { success: true, message: 'Reserva recorrente excluída com sucesso!' };
  } catch (error)
{
    console.error('Failed to delete recurring reservation:', error);
    return { success: false, message: 'Erro ao excluir reserva recorrente.' };
  }
}
