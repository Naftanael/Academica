// src/lib/actions/event_reservations.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import type { EventReservation, ClassroomRecurringReservation, ClassGroup } from '@/types';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import { SHIFT_TIME_RANGES, JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';
import { timeRangesOverlap } from '@/lib/utils';
import { parseISO, getDay, isWithinInterval } from 'date-fns';
import { FieldValue } from 'firebase-admin/firestore';

const eventReservationsCollection = db ? db.collection('event_reservations') : null;
const recurringReservationsCollection = db ? db.collection('recurring_reservations') : null;
const classGroupsCollection = db ? db.collection('classgroups') : null;
const classroomsCollection = db ? db.collection('classrooms') : null;

// Helper to convert Firestore doc to EventReservation type
const docToEventReservation = (doc: FirebaseFirestore.DocumentSnapshot): EventReservation => {
    return { id: doc.id, ...doc.data() } as EventReservation;
};

export async function getEventReservations(): Promise<EventReservation[]> {
    if (!eventReservationsCollection) {
        console.error("Firestore is not initialized.");
        return [];
    }
  try {
    const snapshot = await eventReservationsCollection.orderBy('date', 'desc').get();
    return snapshot.docs.map(docToEventReservation);
  } catch (error) {
    console.error('Failed to get event reservations from Firestore:', error);
    return [];
  }
}

// Refactored to work with useFormState
export async function createEventReservation(prevState: any, values: EventReservationFormValues) {
    if (!db || !eventReservationsCollection || !recurringReservationsCollection || !classGroupsCollection || !classroomsCollection) {
        return { success: false, message: 'Erro: O banco de dados não foi inicializado.' };
    }
  const validatedFields = eventReservationFormSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { date, classroomId, startTime, endTime } = validatedFields.data;
    const newEventDate = parseISO(date);
    const newEventDayOfWeekPt = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(newEventDate)];

    await db.runTransaction(async (transaction) => {
        // 1. Check for conflicts with other single-event reservations
        const eventConflictQuery = eventReservationsCollection
            .where('classroomId', '==', classroomId)
            .where('date', '==', date);
        const eventConflictSnapshot = await transaction.get(eventConflictQuery);

        for (const doc of eventConflictSnapshot.docs) {
            const existingEvent = doc.data() as EventReservation;
            if (timeRangesOverlap(startTime, endTime, existingEvent.startTime, existingEvent.endTime)) {
                const classroomDoc = await transaction.get(classroomsCollection.doc(classroomId));
                throw new Error(`Conflito: A sala "${classroomDoc.data()?.name || 'desconhecida'}" já tem o evento "${existingEvent.title}" neste horário.`);
            }
        }

        // 2. Check for conflicts with recurring reservations
        const recurringConflictQuery = recurringReservationsCollection.where('classroomId', '==', classroomId);
        const recurringSnapshot = await transaction.get(recurringConflictQuery);

        for (const doc of recurringSnapshot.docs) {
            const recurringRes = doc.data() as ClassroomRecurringReservation;
            if (isWithinInterval(newEventDate, { start: parseISO(recurringRes.startDate), end: parseISO(recurringRes.endDate) })) {
                const classGroupDoc = await transaction.get(classGroupsCollection.doc(recurringRes.classGroupId));
                if (!classGroupDoc.exists) continue;

                const classGroup = classGroupDoc.data() as ClassGroup;
                if (classGroup.classDays?.includes(newEventDayOfWeekPt)) {
                    const shiftTimeRange = SHIFT_TIME_RANGES[classGroup.shift];
                    if (timeRangesOverlap(startTime, endTime, shiftTimeRange.start, shiftTimeRange.end)) {
                        const classroomDoc = await transaction.get(classroomsCollection.doc(classroomId));
                        throw new Error(`Conflito: A sala "${classroomDoc.data()?.name || 'desconhecida'}" tem uma reserva recorrente para a turma "${classGroup.name}" neste horário.`);
                    }
                }
            }
        }

        const newEventRef = eventReservationsCollection.doc();
        transaction.set(newEventRef, { ...validatedFields.data, createdAt: FieldValue.serverTimestamp() });
    });

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento criada com sucesso!' };

  } catch (error) {
    console.error('Failed to create event reservation:', error);
    return { success: false, message: (error as Error).message || 'Erro interno ao criar reserva.' };
  }
}

export async function deleteEventReservation(id: string) {
    if (!eventReservationsCollection) {
        return { success: false, message: 'Erro: O banco de dados não foi inicializado.' };
    }
  try {
    await eventReservationsCollection.doc(id).delete();

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete event reservation ${id}:`, error);
    return { success: false, message: 'Erro ao excluir reserva de evento.' };
  }
}
