
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import type { EventReservation, ClassroomRecurringReservation, ClassGroup, Classroom } from '@/types';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import { SHIFT_TIME_RANGES, JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';
import { timeRangesOverlap } from '@/lib/utils';
import { parseISO, getDay, isWithinInterval } from 'date-fns';
import { FieldValue } from 'firebase-admin/firestore';

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
    const newEventDayOfWeekPt = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(newEventDate)];

    await db.runTransaction(async (transaction) => {
        // 1. Check for conflicts with other single-event reservations
        const eventConflictQuery = eventReservationsCollection
            .where('classroomId', '==', validatedValues.classroomId)
            .where('date', '==', validatedValues.date);
        const eventConflictSnapshot = await transaction.get(eventConflictQuery);

        for (const doc of eventConflictSnapshot.docs) {
            const existingEvent = doc.data() as EventReservation;
            if (timeRangesOverlap(validatedValues.startTime, validatedValues.endTime, existingEvent.startTime, existingEvent.endTime)) {
                const classroom = await transaction.get(classroomsCollection.doc(validatedValues.classroomId));
                throw new Error(`Conflito: A sala "${classroom.data()?.name || 'desconhecida'}" já tem o evento "${existingEvent.title}" neste dia e horário.`);
            }
        }

        // 2. Check for conflicts with recurring reservations
        const recurringConflictQuery = recurringReservationsCollection.where('classroomId', '==', validatedValues.classroomId);
        const recurringSnapshot = await transaction.get(recurringConflictQuery);

        for (const doc of recurringSnapshot.docs) {
            const recurringRes = doc.data() as ClassroomRecurringReservation;
            const recurringStartDate = parseISO(recurringRes.startDate);
            const recurringEndDate = parseISO(recurringRes.endDate);

            if (isWithinInterval(newEventDate, { start: recurringStartDate, end: recurringEndDate })) {
                const classGroupDoc = await transaction.get(classGroupsCollection.doc(recurringRes.classGroupId));
                if (!classGroupDoc.exists) continue;

                const classGroup = classGroupDoc.data() as ClassGroup;
                if (classGroup.classDays?.includes(newEventDayOfWeekPt)) {
                    const shiftTimeRange = SHIFT_TIME_RANGES[classGroup.shift];
                    if (timeRangesOverlap(validatedValues.startTime, validatedValues.endTime, shiftTimeRange.start, shiftTimeRange.end)) {
                        const classroom = await transaction.get(classroomsCollection.doc(validatedValues.classroomId));
                        throw new Error(`Conflito: A sala "${classroom.data()?.name || 'desconhecida'}" tem uma reserva recorrente para a turma "${classGroup.name}" que colide com este dia e horário.`);
                    }
                }
            }
        }

        // If no conflicts, create the new event reservation
        const newEventRef = eventReservationsCollection.doc();
        transaction.set(newEventRef, { ...validatedValues, createdAt: FieldValue.serverTimestamp() });
    });

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento criada com sucesso!' };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create event reservation in Firestore:', error);
    return { success: false, message: (error as Error).message || 'Erro interno ao criar reserva de evento.' };
  }
}

export async function deleteEventReservation(id: string) {
  try {
    await db.runTransaction(async (transaction) => {
        const docRef = eventReservationsCollection.doc(id);
        const doc = await transaction.get(docRef);
        if (doc.exists) {
            transaction.delete(docRef);
        }
    });

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete event reservation ${id} from Firestore:`, error);
    return { success: false, message: 'Erro interno ao excluir reserva de evento.' };
  }
}
