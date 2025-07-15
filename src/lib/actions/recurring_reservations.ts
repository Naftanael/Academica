// src/lib/actions/recurring_reservations.ts
'use server';

import { revalidatePath } from 'next/cache';
// import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { parseISO, format, addDays, getDay } from 'date-fns';

import { db } from '@/lib/firebase/firebaseAdmin';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import { dateRangesOverlap } from '@/lib/utils';
import type { ClassroomRecurringReservation, DayOfWeek, ClassGroup } from '@/types';

// const recurringReservationsCollection = db.collection('recurring_reservations');
// const classGroupsCollection = db.collection('classgroups');

export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
  console.log("Firebase desativado: getRecurringReservations retornando array vazio.");
  return [];
}

export async function createRecurringReservation(prevState: any, values: RecurringReservationFormValues) {
  console.log("Firebase desativado: createRecurringReservation retornando erro.");
  const validatedFields = recurringReservationFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação (Firebase desativado).',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  return { success: false, message: 'Firebase está temporariamente desativado.' };
}

export async function deleteRecurringReservation(id: string) {
  console.log(`Firebase desativado: deleteRecurringReservation para o ID ${id} retornando erro.`);
  return { success: false, message: 'Firebase está temporariamente desativado.' };
}
