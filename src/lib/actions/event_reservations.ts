// src/lib/actions/event_reservations.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { parseISO, getDay, isWithinInterval } from 'date-fns';

import { db } from '@/lib/firebase/admin';
import { eventReservationFormSchema, type EventReservationFormValues } from '@/lib/schemas/event_reservations';
import { SHIFT_TIME_RANGES, JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';
import { timeRangesOverlap } from '@/lib/utils';
import type { EventReservation, ClassroomRecurringReservation, ClassGroup } from '@/types';

// Coleções do Firestore. A inicialização é garantida pelo 'admin.ts'.
const eventReservationsCollection = db.collection('event_reservations');
const recurringReservationsCollection = db.collection('recurring_reservations');
const classGroupsCollection = db.collection('classgroups');
const classroomsCollection = db.collection('classrooms');

// Helper para converter um documento do Firestore para o tipo EventReservation.
const docToEventReservation = (doc: FirebaseFirestore.DocumentSnapshot): EventReservation => {
    const data = doc.data();
    if (!data) throw new Error(`Document data not found for doc with id ${doc.id}`);
    return { id: doc.id, ...data } as EventReservation;
};

/**
 * Busca todas as reservas de eventos, ordenadas por data.
 * Lança um erro em caso de falha na comunicação com o banco de dados.
 */
export async function getEventReservations(): Promise<EventReservation[]> {
  try {
    const snapshot = await eventReservationsCollection.orderBy('date', 'desc').get();
    return snapshot.docs.map(docToEventReservation);
  } catch (error) {
    console.error('Error fetching event reservations from Firestore:', error);
    throw new Error('Failed to retrieve event reservations.');
  }
}

/**
 * Cria uma nova reserva de evento, verificando conflitos dentro de uma transação atômica.
 */
export async function createEventReservation(prevState: any, values: EventReservationFormValues) {
  const validatedFields = eventReservationFormSchema.safeParse(values);
  
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { date, classroomId, startTime, endTime } = validatedFields.data;
  const newEventDate = parseISO(date);
  const newEventDayOfWeekPt = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(newEventDate)];

  try {
    await db.runTransaction(async (transaction) => {
        // 1. Verificar conflitos com outras reservas de evento pontuais.
        const eventConflictQuery = eventReservationsCollection.where('classroomId', '==', classroomId).where('date', '==', date);
        const eventConflictSnapshot = await transaction.get(eventConflictQuery);

        for (const doc of eventConflictSnapshot.docs) {
            const existingEvent = doc.data() as EventReservation;
            if (timeRangesOverlap(startTime, endTime, existingEvent.startTime, existingEvent.endTime)) {
                const classroomDoc = await transaction.get(classroomsCollection.doc(classroomId));
                throw new Error(`Conflito: A sala "${classroomDoc.data()?.name || 'desconhecida'}" já possui o evento "${existingEvent.title}" neste horário.`);
            }
        }

        // 2. Verificar conflitos com reservas recorrentes de turmas.
        const recurringConflictQuery = recurringReservationsCollection.where('classroomId', '==', classroomId);
        const recurringSnapshot = await transaction.get(recurringConflictQuery);

        for (const doc of recurringSnapshot.docs) {
            const recurringRes = doc.data() as ClassroomRecurringReservation;
            // Verifica se a data do novo evento está dentro do intervalo da reserva recorrente.
            if (isWithinInterval(newEventDate, { start: parseISO(recurringRes.startDate), end: parseISO(recurringRes.endDate) })) {
                const classGroupDoc = await transaction.get(classGroupsCollection.doc(recurringRes.classGroupId));
                if (!classGroupDoc.exists) continue;

                const classGroup = classGroupDoc.data() as ClassGroup;
                // Verifica se o dia da semana corresponde e se os horários colidem.
                if (classGroup.classDays?.includes(newEventDayOfWeekPt)) {
                    const shiftTimeRange = SHIFT_TIME_RANGES[classGroup.shift];
                    if (timeRangesOverlap(startTime, endTime, shiftTimeRange.start, shiftTimeRange.end)) {
                        const classroomDoc = await transaction.get(classroomsCollection.doc(classroomId));
                        throw new Error(`Conflito: A sala "${classroomDoc.data()?.name || 'desconhecida'}" possui uma reserva recorrente para a turma "${classGroup.name}" neste horário.`);
                    }
                }
            }
        }

        // Se não houver conflitos, cria a nova reserva.
        const newEventRef = eventReservationsCollection.doc();
        transaction.set(newEventRef, { ...validatedFields.data, createdAt: FieldValue.serverTimestamp() });
    });

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento criada com sucesso!' };

  } catch (error: any) {
    console.error('Failed to create event reservation:', error);
    // Retorna a mensagem de erro específica lançada de dentro da transação.
    return { success: false, message: error.message || 'Ocorreu um erro no servidor ao criar a reserva.' };
  }
}

/**
 * Deleta uma reserva de evento do Firestore.
 */
export async function deleteEventReservation(id: string) {
  try {
    await eventReservationsCollection.doc(id).delete();

    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return { success: true, message: 'Reserva de evento excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete event reservation ${id}:`, error);
    return { success: false, message: 'Ocorreu um erro no servidor ao excluir a reserva.' };
  }
}
