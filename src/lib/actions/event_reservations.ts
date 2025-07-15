/**
 * @file Define as Server Actions para gerenciar as reservas de eventos pontuais.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
// import { FieldValue } from 'firebase-admin/firestore';
import { parseISO, getDay, isWithinInterval } from 'date-fns';

// import { db } from '@/lib/firebase/firebaseAdmin';
import {
  eventReservationFormSchema,
  type EventReservationFormValues,
} from '@/lib/schemas/event_reservations';
import {
  SHIFT_TIME_RANGES,
  JS_DAYS_OF_WEEK_MAP_TO_PT,
} from '@/lib/constants';
import { timeRangesOverlap } from '@/lib/utils';
import type {
  EventReservation,
  ClassroomRecurringReservation,
  ClassGroup,
} from '@/types';

// const eventReservationsCollection = db.collection('event_reservations');
// const recurringReservationsCollection = db.collection('recurring_reservations');
// const classGroupsCollection = db.collection('classgroups');
// const classroomsCollection = db.collection('classrooms');


const docToEventReservation = (
  doc: any,
): EventReservation => {
  const data = doc.data();
  if (!data) {
    throw new Error(
      `Dados não encontrados para o documento com ID ${doc.id}`,
    );
  }
  return { id: doc.id, ...data } as EventReservation;
};


export async function getEventReservations(): Promise<EventReservation[]> {
    console.log("Firebase desativado: getEventReservations retornando array vazio.");
    return [];
//   try {
//     const snapshot = await eventReservationsCollection
//       .orderBy('date', 'desc')
//       .get();
//     return snapshot.docs.map(docToEventReservation);
//   } catch (error) {
//     console.error(
//       'Erro ao buscar reservas de eventos no Firestore:',
//       error,
//     );
//     throw new Error('Falha ao buscar os dados das reservas de eventos.');
//   }
}

export async function createEventReservation(
  prevState: any,
  values: EventReservationFormValues,
) {
  console.log("Firebase desativado: createEventReservation retornando erro.");
  return { success: false, message: 'Firebase está temporariamente desativado.' };

//   const validatedFields = eventReservationFormSchema.safeParse(values);
//   if (!validatedFields.success) {
//     return {
//       success: false,
//       message:
//         'Erro de validação. Por favor, verifique os campos do formulário.',
//       errors: validatedFields.error.flatten().fieldErrors,
//     };
//   }

//   const { date, classroomId, startTime, endTime } = validatedFields.data;
//   const newEventDate = parseISO(date);
//   const newEventDayOfWeekPt =
//     JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(newEventDate)];

//   try {
//     await db.runTransaction(async (transaction) => {
//       const eventConflictQuery = eventReservationsCollection
//         .where('classroomId', '==', classroomId)
//         .where('date', '==', date);
//       const eventConflictSnapshot = await transaction.get(eventConflictQuery);

//       for (const doc of eventConflictSnapshot.docs) {
//         const existingEvent = doc.data() as EventReservation;
//         if (
//           timeRangesOverlap(
//             startTime,
//             endTime,
//             existingEvent.startTime,
//             existingEvent.endTime,
//           )
//         ) {
//           const classroomDoc = await transaction.get(
//             classroomsCollection.doc(classroomId),
//           );
//           throw new Error(
//             `Conflito: A sala "${
//               classroomDoc.data()?.name || 'desconhecida'
//             }" já possui o evento "${
//               existingEvent.title
//             }" neste horário.`,
//           );
//         }
//       }

//       const recurringConflictQuery = recurringReservationsCollection.where(
//         'classroomId',
//         '==',
//         classroomId,
//       );
//       const recurringSnapshot = await transaction.get(recurringConflictQuery);

//       for (const doc of recurringSnapshot.docs) {
//         const recurringRes = doc.data() as ClassroomRecurringReservation;
//         if (
//           isWithinInterval(newEventDate, {
//             start: parseISO(recurringRes.startDate),
//             end: parseISO(recurringRes.endDate),
//           })
//         ) {
//           const classGroupDoc = await transaction.get(
//             classGroupsCollection.doc(recurringRes.classGroupId),
//           );
//           if (!classGroupDoc.exists) continue; 

//           const classGroup = classGroupDoc.data() as ClassGroup;
//           if (classGroup.classDays?.includes(newEventDayOfWeekPt)) {
//             const shiftTimeRange = SHIFT_TIME_RANGES[classGroup.shift];
//             if (
//               timeRangesOverlap(
//                 startTime,
//                 endTime,
//                 shiftTimeRange.start,
//                 shiftTimeRange.end,
//               )
//             ) {
//               const classroomDoc = await transaction.get(
//                 classroomsCollection.doc(classroomId),
//               );
//               throw new Error(
//                 `Conflito: A sala "${
//                   classroomDoc.data()?.name || 'desconhecida'
//                 }" possui uma reserva recorrente para a turma "${
//                   classGroup.name
//                 }" neste dia e turno.`,
//               );
//             }
//           }
//         }
//       }
//       const newEventRef = eventReservationsCollection.doc();
//       transaction.set(newEventRef, {
//         ...validatedFields.data,
//         createdAt: FieldValue.serverTimestamp(),
//       });
//     });

//     revalidatePath('/reservations');
//     revalidatePath('/room-availability');

//     return { success: true, message: 'Reserva de evento criada com sucesso!' };
//   } catch (error: any) {
//     console.error('Falha ao criar reserva de evento:', error);
//     return {
//       success: false,
//       message:
//         error.message ||
//         'Ocorreu um erro inesperado no servidor ao criar a reserva.',
//     };
//   }
}

export async function deleteEventReservation(id: string) {
    console.log(`Firebase desativado: deleteEventReservation para o ID ${id} retornando erro.`);
    return { success: false, message: 'Firebase está temporariamente desativado.' };
//   try {
//     await eventReservationsCollection.doc(id).delete();

//     revalidatePath('/reservations');
//     revalidatePath('/room-availability');
//     return {
//       success: true,
//       message: 'Reserva de evento excluída com sucesso!',
//     };
//   } catch (error) {
//     console.error(
//       `Falha ao deletar a reserva de evento ${id}:`,
//       error,
//     );
//     return {
//       success: false,
//       message: 'Ocorreu um erro inesperado no servidor ao excluir a reserva.',
//     };
//   }
}
