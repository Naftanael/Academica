'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import type { EventReservation, ClassroomRecurringReservation, ClassGroup, Classroom } from '@/types';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import { SHIFT_TIME_RANGES, JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';
import { timeRangesOverlap } from '@/lib/utils';
import { parseISO, getDay, isWithinInterval } from 'date-fns';

const eventReservationsCollection = db.collection('event_reservations');
const recurringReservationsCollection = db.collection('recurring_reservations');
const classGroupsCollection = db.collection('classgroups');
const classroomsCollection = db.collection('classrooms');

// Helper to convert Firestore doc to EventReservation type
const docToEventReservation = (doc: FirebaseFirestore.DocumentSnapshot): EventReservation => {
    return { id: doc.id, ...doc.data() } as EventReservation;
};

export async function getEventReservations(): Promise<EventReservation[]> {
  try {
    const snapshot = await eventReservationsCollection.orderBy('date', 'desc').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(docToEventReservation);
  } catch (error) {
    console.error('Failed to get event reservations from Firestore:', error);
    return [];
  }
}

export async function createEventReservation(values: EventReservationFormValues) {
  try {
    const validatedValues = eventReservationFormSchema.parse(values);
    const newEventDate = parseISO(validatedValues.date);

    // 1. Check for conflicts with other single-event reservations
    const eventConflictQuery = eventReservationsCollection
        .where('classroomId', '==', validatedValues.classroomId)
        .where('date', '==', validatedValues.date);

    const eventConflictSnapshot = await eventConflictQuery.get();

    for (const doc of eventConflictSnapshot.docs) {
        const existingEvent = doc.data() as EventReservation;
        if (timeRangesOverlap(validatedValues.startTime, validatedValues.endTime, existingEvent.startTime, existingEvent.endTime)) {
            const classroom = await classroomsCollection.doc(validatedValues.classroomId).get();
            return {
                success: false,
                message: `Conflito: A sala "${classroom.data()?.name || 'desconhecida'}" já tem o evento "${existingEvent.title}" neste dia e horário.`
            };
        }
    }

    // 2. Check for conflicts with recurring reservations
    const newEventDayOfWeekPt = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(newEventDate)];

    const recurringConflictQuery = recurringReservationsCollection.where('classroomId', '==', validatedValues.classroomId);
    const recurringSnapshot = await recurringConflictQuery.get();

    for (const doc of recurringSnapshot.docs) {
        const recurringRes = doc.data() as ClassroomRecurringReservation;
        const recurringStartDate = parseISO(recurringRes.startDate);
        const recurringEndDate = parseISO(recurringRes.endDate);

        // Check if the new event date is within the recurring reservation's date range
        if (isWithinInterval(newEventDate, { start: recurringStartDate, end: recurringEndDate })) {
            const classGroupDoc = await classGroupsCollection.doc(recurringRes.classGroupId).get();
            if (!classGroupDoc.exists) continue;

            const classGroup = classGroupDoc.data() as ClassGroup;
            // Check if the day of the week and shift match
            if (classGroup.classDays?.includes(newEventDayOfWeekPt)) {
                const shiftTimeRange = SHIFT_TIME_RANGES[classGroup.shift];
                if (timeRangesOverlap(validatedValues.startTime, validatedValues.endTime, shiftTimeRange.start, shiftTimeRange.end)) {
                    const classroom = await classroomsCollection.doc(validatedValues.classroomId).get();
                    return {
                        success: false,
                        message: `Conflito: A sala "${classroom.data()?.name || 'desconhecida'}" tem uma reserva recorrente para a turma "${classGroup.name}" que colide com este dia e horário.`
                    };
                }
            }
        }
    }
    
    // If no conflicts, create the new event reservation
    await eventReservationsCollection.add(validatedValues);

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento criada com sucesso!' };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create event reservation in Firestore:', error);
    return { success: false, message: 'Erro interno ao criar reserva de evento.' };
  }
}

export async function deleteEventReservation(id: string) {
  try {
    const docRef = eventReservationsCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
        return { success: false, message: 'Reserva de evento não encontrada para exclusão.' };
    }

    await docRef.delete();

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete event reservation ${id} from Firestore:`, error);
    return { success: false, message: 'Erro interno ao excluir reserva de evento.' };
  }
}
