// src/lib/actions/recurring_reservations.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getDb } from '@/lib/database';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import type { ClassroomRecurringReservation } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
  try {
    const db = await getDb();
    const reservations = await db.all('SELECT * FROM recurring_reservations');
    return reservations.map(r => ({ ...r, daysOfWeek: JSON.parse(r.days_of_week) }));
  } catch (error) {
    console.error('Failed to fetch recurring reservations:', error);
    return [];
  }
}

export async function createRecurringReservation(prevState: any, values: RecurringReservationFormValues) {
  const validatedFields = recurringReservationFormSchema.safeParse(values);
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
      'INSERT INTO recurring_reservations (id, event_name, classroom_id, start_date, end_date, start_time, end_time, days_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      newReservationId,
      validatedFields.data.purpose,
      validatedFields.data.classroomId,
      validatedFields.data.startDate,
      '2024-12-31', // mock endDate
      '00:00', // mock startTime
      '00:00', // mock endTime
      JSON.stringify([]) // mock days of week
    );
    revalidatePath('/reservations');
    return { success: true, message: 'Recurring reservation created successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}

export async function deleteRecurringReservation(id: string) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM recurring_reservations WHERE id = ?', id);
    revalidatePath('/reservations');
    return { success: true, message: 'Recurring reservation deleted successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}
