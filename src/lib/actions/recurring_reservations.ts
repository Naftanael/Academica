// src/lib/actions/recurring_reservations.ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import type { ClassroomRecurringReservation, DayOfWeek, ClassGroup } from '@/types';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import { z } from 'zod';
import { dateRangesOverlap } from '@/lib/utils';
import { parseISO, format, addDays, getDay } from 'date-fns';
import { FieldValue } from 'firebase-admin/firestore';

const recurringReservationsCollection = db.collection('recurring_reservations');
const classGroupsCollection = db.collection('classgroups');

const dayOfWeekMapping: Record<DayOfWeek, number> = {
  'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
};

function calculateEndDate(startDate: Date, classDays: DayOfWeek[], numberOfClasses: number): Date {
  if (numberOfClasses <= 0 || !classDays || classDays.length === 0) return new Date(startDate);
  
  const numericalClassDays = classDays.map(d => dayOfWeekMapping[d]);
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  let classesCount = 0;
  let lastClassDate = new Date(currentDate);

  while (classesCount < numberOfClasses) {
    if (numericalClassDays.includes(getDay(currentDate))) {
      classesCount++;
      lastClassDate = new Date(currentDate);
    }
    if (classesCount < numberOfClasses) {
        currentDate = addDays(currentDate, 1);
    }
  }
  return lastClassDate;
}

export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
  try {
    const snapshot = await recurringReservationsCollection.orderBy('startDate').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomRecurringReservation));
  } catch (error) {
    console.error('Failed to get recurring reservations:', error);
    return [];
  }
}

// Refactored to work with useFormState
export async function createRecurringReservation(prevState: any, values: RecurringReservationFormValues) {
  const validatedFields = recurringReservationFormSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const { classGroupId, classroomId, startDate, numberOfClasses, purpose } = validatedFields.data;
    
    await db.runTransaction(async (transaction) => {
        const classGroupDoc = await transaction.get(classGroupsCollection.doc(classGroupId));
        if (!classGroupDoc.exists) throw new Error('Turma não encontrada.');
        
        const newReservationClassGroup = classGroupDoc.data() as ClassGroup;
        const newResStartDate = parseISO(startDate);
        const newResEndDate = calculateEndDate(newResStartDate, newReservationClassGroup.classDays, numberOfClasses);

        const conflictQuery = recurringReservationsCollection.where('classroomId', '==', classroomId);
        const snapshot = await transaction.get(conflictQuery);

        for (const doc of snapshot.docs) {
            const existingRes = doc.data() as ClassroomRecurringReservation;
            const existingResStartDate = parseISO(existingRes.startDate);
            const existingResEndDate = parseISO(existingRes.endDate);

            if (dateRangesOverlap(newResStartDate, newResEndDate, existingResStartDate, existingResEndDate)) {
                const existingResClassGroupDoc = await transaction.get(classGroupsCollection.doc(existingRes.classGroupId));
                if (!existingResClassGroupDoc.exists) continue;
                
                const existingResClassGroup = existingResClassGroupDoc.data() as ClassGroup;
                const commonClassDays = newReservationClassGroup.classDays.filter(day => existingResClassGroup.classDays?.includes(day));

                if (commonClassDays.length > 0) {
                    throw new Error(`Conflito: A sala já está reservada para "${existingResClassGroup.name}" em dias (${commonClassDays.join(', ')}) que se sobrepõem ao período.`);
                }
            }
        }

        const newReservationRef = recurringReservationsCollection.doc();
        transaction.set(newReservationRef, {
            classGroupId,
            classroomId,
            startDate,
            endDate: format(newResEndDate, 'yyyy-MM-dd'),
            purpose,
            createdAt: FieldValue.serverTimestamp(),
        });
    });

    revalidatePath('/reservations');
    revalidatePath('/room-availability'); 
    return { success: true, message: 'Reserva recorrente criada com sucesso!' };

  } catch (error) {
    console.error('Failed to create recurring reservation:', error);
    return { success: false, message: (error as Error).message || 'Erro ao criar reserva.' };
  }
}

export async function deleteRecurringReservation(id: string) {
  try {
    await recurringReservationsCollection.doc(id).delete();

    revalidatePath('/reservations');
    revalidatePath('/room-availability'); 
    return { success: true, message: 'Reserva recorrente excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete recurring reservation ${id}:`, error);
    return { success: false, message: 'Erro ao excluir reserva.' };
  }
}
