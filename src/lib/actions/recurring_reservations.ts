
'use server';

import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { ClassroomRecurringReservation, ClassGroup } from '@/types';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import { z } from 'zod';
import { getClassGroups } from './classgroups'; // Added import
import { getClassrooms } from './classrooms'; // Added import

export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
  return await readData<ClassroomRecurringReservation>('recurring_reservations.json');
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

    for (const existingRes of existingReservations) {
      // 1. Check for same classroom
      if (existingRes.classroomId !== validatedValues.classroomId) {
        continue;
      }

      // 2. Check for date range overlap
      const newResStart = new Date(validatedValues.startDate);
      const newResEnd = new Date(validatedValues.endDate);
      const existingResStart = new Date(existingRes.startDate);
      const existingResEnd = new Date(existingRes.endDate);

      // Overlap if (StartA <= EndB) and (EndA >= StartB)
      if (!(newResStart <= existingResEnd && newResEnd >= existingResStart)) {
        continue;
      }

      // 3. Check for day of week and time overlap
      const existingResClassGroup = allClassGroups.find(cg => cg.id === existingRes.classGroupId);
      if (!existingResClassGroup) {
        console.warn(`Turma ${existingRes.classGroupId} da reserva existente ${existingRes.id} não encontrada. Pulando checagem de conflito para esta reserva.`);
        continue;
      }
      const existingReservationClassDays = existingResClassGroup.classDays;

      // Find common class days between the new reservation's class group and the existing one's
      const commonClassDays = newReservationClassDays.filter(day => existingReservationClassDays.includes(day));

      if (commonClassDays.length > 0) {
        // If there are common class days, now check for time overlap
        const newStartTime = validatedValues.startTime; // "HH:mm"
        const newEndTime = validatedValues.endTime;     // "HH:mm"
        const existingStartTime = existingRes.startTime; // "HH:mm"
        const existingEndTime = existingRes.endTime;   // "HH:mm"

        // Time overlap condition: (newStart < existingEnd) AND (newEnd > existingStart)
        if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
          // CONFLICT!
          const conflictingClassroomName = allClassrooms.find(c => c.id === validatedValues.classroomId)?.name || validatedValues.classroomId;
          const conflictingTurmaName = existingResClassGroup.name;
          const formattedCommonDays = commonClassDays.join(', ');
          
          return {
            success: false,
            message: `Conflito de agendamento: A sala "${conflictingClassroomName}" já está reservada para a turma "${conflictingTurmaName}" em dias de ${formattedCommonDays} entre ${existingStartTime} e ${existingEndTime} durante o período selecionado ou parte dele.`,
          };
        }
      }
    }

    // If no conflicts, proceed to create the reservation
    const newReservation: ClassroomRecurringReservation = {
      id: generateId(),
      ...validatedValues,
    };

    existingReservations.push(newReservation);
    await writeData('recurring_reservations.json', existingReservations);

    revalidatePath('/reservations');
    return { success: true, message: 'Reserva recorrente criada com sucesso!', data: newReservation };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create recurring reservation:', error);
    return { success: false, message: 'Erro ao criar reserva recorrente.' };
  }
}

export async function deleteRecurringReservation(id: string) {
  try {
    let reservations = await getRecurringReservations();
    reservations = reservations.filter(r => r.id !== id);
    await writeData('recurring_reservations.json', reservations);
    revalidatePath('/reservations');
    return { success: true, message: 'Reserva recorrente excluída com sucesso!' };
  } catch (error) {
    console.error('Failed to delete recurring reservation:', error);
    return { success: false, message: 'Erro ao excluir reserva recorrente.' };
  }
}
