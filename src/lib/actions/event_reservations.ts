
/**
 * @file Manages all server-side actions for event reservations using Firestore.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firestore';
import { eventReservationSchema } from '@/lib/schemas/event_reservations';
import type { EventReservation } from '@/types';

type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Creates a new event reservation, checking for classroom availability first.
 */
export async function createEventReservation(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = eventReservationSchema.safeParse({
    eventName: formData.get('eventName'),
    classroomId: formData.get('classroomId'),
    date: new Date(formData.get('date') as string),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { classroomId, date, startTime, endTime } = validatedFields.data;

  try {
    // FIRESTORE LOGIC: Check for existing reservations for the same classroom and time
    const existingReservationsSnapshot = await db.collection('event_reservations')
      .where('classroomId', '==', classroomId)
      .where('date', '==', date)
      .get();

    const isOverlapping = existingReservationsSnapshot.docs.some(doc => {
        const reservation = doc.data();
        // Basic time overlap check
        return startTime < reservation.endTime && endTime > reservation.startTime;
    });

    if (isOverlapping) {
      return { success: false, message: 'This classroom is already booked for the selected date and time.' };
    }

    await db.collection('event_reservations').add(validatedFields.data);

    revalidatePath('/reservations');
    return { success: true, message: 'Event reservation created successfully!' };
  } catch (error) {
    console.error('Error creating event reservation:', error);
    return { success: false, message: 'Server Error: Failed to create reservation.' };
  }
}

/**
 * Fetches all event reservations and enriches them with classroom names.
 */
export async function getEventReservations(): Promise<(EventReservation & { classroomName?: string })[]> {
  try {
    const reservationsSnapshot = await db.collection('event_reservations').orderBy('date', 'desc').get();
    if (reservationsSnapshot.empty) {
      return [];
    }

    const reservationsPromises = reservationsSnapshot.docs.map(async (doc) => {
      const reservation = doc.data();
      const id = doc.id;
      
      let classroomName = 'Unknown';
      if (reservation.classroomId) {
        const classroomDoc = await db.collection('classrooms').doc(reservation.classroomId).get();
        if (classroomDoc.exists) {
          classroomName = classroomDoc.data()?.name || 'Unknown';
        }
      }
      
      return {
        id,
        ...reservation,
        date: reservation.date.toDate(), // Convert Timestamp to Date
        classroomName,
      } as EventReservation & { classroomName?: string };
    });

    return Promise.all(reservationsPromises);
  } catch (error) {
    console.error('Error fetching event reservations:', error);
    return [];
  }
}

/**
 * Deletes an event reservation from Firestore.
 */
export async function deleteEventReservation(id: string): Promise<{ success: boolean, message: string }> {
  if (!id) {
    return { success: false, message: 'Reservation ID is required.' };
  }
  try {
    await db.collection('event_reservations').doc(id).delete();
    revalidatePath('/reservations');
    return { success: true, message: 'Event reservation deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting event reservation with ID ${id}:`, error);
    return { success: false, message: 'Server Error: Failed to delete reservation.' };
  }
}
