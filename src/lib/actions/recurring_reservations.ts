
'use server';

import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { ClassroomRecurringReservation, DayOfWeek } from '@/types';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import { z } from 'zod'; // Keep z here for ZodError instance check

export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
  return await readData<ClassroomRecurringReservation>('recurring_reservations.json');
}

export async function createRecurringReservation(values: RecurringReservationFormValues) {
  try {
    const validatedValues = recurringReservationFormSchema.parse(values);
    const reservations = await getRecurringReservations();

    // Basic conflict detection (can be enhanced later)
    // For now, this is a placeholder. True conflict detection is complex.
    // console.log("Future: Implement conflict detection here.");

    const newReservation: ClassroomRecurringReservation = {
      id: generateId(),
      ...validatedValues,
      dayOfWeek: validatedValues.dayOfWeek as DayOfWeek, // Ensure type
    };

    reservations.push(newReservation);
    await writeData('recurring_reservations.json', reservations);

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
