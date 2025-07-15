/**
 * @file Define as Server Actions para gerenciar as reservas de eventos pontuais.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
// import { FieldValue } from 'firebase-admin/firestore';
import { parseISO, getDay, isWithinInterval } from 'date-fns';

import { db } from '@/lib/firebase/firebaseAdmin';
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
}

export async function createEventReservation(
  prevState: any,
  values: EventReservationFormValues,
) {
  console.log("Firebase desativado: createEventReservation retornando erro.");
  const validatedFields = eventReservationFormSchema.safeParse(values);
   if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação (Firebase desativado).',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  return { success: false, message: 'Firebase está temporariamente desativado.' };
}

export async function deleteEventReservation(id: string) {
    console.log(`Firebase desativado: deleteEventReservation para o ID ${id} retornando erro.`);
    return { success: false, message: 'Firebase está temporariamente desativado.' };
}
