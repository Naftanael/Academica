/**
 * @file Define as Server Actions para gerenciar as reservas de eventos pontuais.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/database';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import type { EventReservation } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function getEventReservations(): Promise<EventReservation[]> {
  try {
    const db = await getDb();
    const reservations = await db.all('SELECT * FROM event_reservations');
    return reservations;
  } catch (error) {
    console.error('Failed to fetch event reservations:', error);
    return [];
  }
}

export async function createEventReservation(prevState: any, values: EventReservationFormValues) {
  const validatedFields = eventReservationFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation error.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const db = await getDb();
    const newReservationId = uuidv4();
    await db.run(
      'INSERT INTO event_reservations (id, event_name, classroom_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)',
      newReservationId,
      validatedFields.data.title,
      validatedFields.data.classroomId,
      validatedFields.data.date,
      validatedFields.data.startTime,
      validatedFields.data.endTime
    );
    revalidatePath('/reservations');
    return { success: true, message: 'Event reservation created successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}

export async function deleteEventReservation(id: string) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM event_reservations WHERE id = ?', id);
    revalidatePath('/reservations');
    return { success: true, message: 'Event reservation deleted successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}
