
/**
 * @file Manages all server-side actions for recurring reservations using Firestore.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firestore';
import { recurringReservationSchema } from '@/lib/schemas/recurring-reservations';
import type { ClassroomRecurringReservation } from '@/types';

type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Creates a new recurring reservation document in Firestore.
 */
export async function createRecurringReservation(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = recurringReservationSchema.safeParse({
    classGroupId: formData.get('classGroupId'),
    classroomId: formData.get('classroomId'),
    startDate: formData.get('startDate'),
    numberOfClasses: Number(formData.get('numberOfClasses')),
    purpose: formData.get('purpose'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // This is a simplified example. In a real application, you would
    // calculate the end date based on the start date, number of classes, and class days.
    await db.collection('recurring_reservations').add({
        ...validatedFields.data,
        // endDate would be calculated here
    });

    revalidatePath('/reservations');
    return { success: true, message: 'Recurring reservation created successfully!' };
  } catch (error) {
    console.error('Error creating recurring reservation:', error);
    return { success: false, message: 'Server Error: Failed to create recurring reservation.' };
  }
}

/**
 * Fetches all recurring reservations from Firestore.
 */
export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
    try {
        const snapshot = await db.collection('recurring_reservations').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate.toDate().toISOString(),
            } as ClassroomRecurringReservation
        });
    } catch (error) {
        console.error('Error fetching recurring reservations:', error);
        return [];
    }
}

export async function deleteRecurringReservation(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'Reservation ID is required.' };
  }
  try {
    await db.collection('recurring_reservations').doc(id).delete();
    revalidatePath('/reservations');
    return { success: true, message: 'Recurring reservation deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting recurring reservation with ID ${id}:`, error);
    return { success: false, message: 'Server Error: Failed to delete recurring reservation.' };
  }
}
