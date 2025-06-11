
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import { DAYS_OF_WEEK } from '@/lib/constants';
import type { ClassroomRecurringReservation, DayOfWeek } from '@/types';
import { isBefore, isEqual } from 'date-fns';

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido. Use HH:MM.");

export const recurringReservationFormSchema = z.object({
  classGroupId: z.string().min(1, "Selecione uma turma."),
  classroomId: z.string().min(1, "Selecione uma sala."),
  startDate: z.string().min(1, "Data de início é obrigatória."),
  endDate: z.string().min(1, "Data de fim é obrigatória."),
  dayOfWeek: z.enum(DAYS_OF_WEEK as [DayOfWeek, ...DayOfWeek[]], { required_error: "Selecione um dia da semana." }),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  purpose: z.string().min(3, "O propósito deve ter pelo menos 3 caracteres.").max(100, "Propósito muito longo."),
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return isBefore(start, end) || isEqual(start, end);
}, {
  message: "A data de início deve ser anterior ou igual à data de fim.",
  path: ["endDate"],
}).refine(data => data.startTime < data.endTime, {
  message: "A hora de início deve ser anterior à hora de fim.",
  path: ["endTime"],
});

export type RecurringReservationFormValues = z.infer<typeof recurringReservationFormSchema>;

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
