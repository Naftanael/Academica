// src/lib/actions/recurring_reservations.ts
'use server';

import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { parseISO, format, addDays, getDay } from 'date-fns';

import { db } from '@/lib/firebase/firebaseAdmin';
import { recurringReservationFormSchema, type RecurringReservationFormValues } from '@/lib/schemas/recurring-reservations';
import { dateRangesOverlap } from '@/lib/utils';
import type { ClassroomRecurringReservation, DayOfWeek, ClassGroup } from '@/types';

// Coleções do Firestore.
const recurringReservationsCollection = db.collection('recurring_reservations');
const classGroupsCollection = db.collection('classgroups');

// Mapeamento de dias da semana para o formato numérico da lib 'date-fns'.
const dayOfWeekMapping: Record<DayOfWeek, number> = {
  'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6
};

/**
 * Calcula a data de término de uma reserva com base na data de início, dias de aula e número de aulas.
 */
function calculateEndDate(startDate: Date, classDays: DayOfWeek[], numberOfClasses: number): Date {
  if (numberOfClasses <= 0 || !classDays || classDays.length === 0) return new Date(startDate);
  
  const numericalClassDays = classDays.map(d => dayOfWeekMapping[d]);
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0); // Zera a hora para evitar bugs de fuso horário.
  let classesCount = 0;
  let lastClassDate = new Date(currentDate);

  while (classesCount < numberOfClasses) {
    if (numericalClassDays.includes(getDay(currentDate))) {
      classesCount++;
      lastClassDate = new Date(currentDate);
    }
    // Avança para o próximo dia apenas se ainda não tivermos encontrado todas as aulas.
    if (classesCount < numberOfClasses) {
        currentDate = addDays(currentDate, 1);
    }
  }
  return lastClassDate;
}

/**
 * Busca todas as reservas recorrentes do Firestore.
 * Lança um erro em caso de falha.
 */
export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
  try {
    const snapshot = await recurringReservationsCollection.orderBy('startDate').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassroomRecurringReservation));
  } catch (error) {
    console.error('Error fetching recurring reservations:', error);
    throw new Error('Failed to retrieve recurring reservations.');
  }
}

/**
 * Cria uma nova reserva recorrente, verificando conflitos dentro de uma transação atômica.
 */
export async function createRecurringReservation(prevState: any, values: RecurringReservationFormValues) {
  const validatedFields = recurringReservationFormSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { classGroupId, classroomId, startDate, numberOfClasses, purpose } = validatedFields.data;

  try {
    await db.runTransaction(async (transaction) => {
        const classGroupDoc = await transaction.get(classGroupsCollection.doc(classGroupId));
        if (!classGroupDoc.exists) throw new Error('A turma selecionada não foi encontrada.');
        
        const newReservationClassGroup = classGroupDoc.data() as ClassGroup;
        const newResStartDate = parseISO(startDate);
        const newResEndDate = calculateEndDate(newResStartDate, newReservationClassGroup.classDays, numberOfClasses);

        const conflictQuery = recurringReservationsCollection.where('classroomId', '==', classroomId);
        const snapshot = await transaction.get(conflictQuery);

        for (const doc of snapshot.docs) {
            const existingRes = doc.data() as ClassroomRecurringReservation;
            const existingResStartDate = parseISO(existingRes.startDate);
            const existingResEndDate = parseISO(existingRes.endDate);

            // Se os períodos de data se sobrepõem, precisamos verificar os detalhes.
            if (dateRangesOverlap(newResStartDate, newResEndDate, existingResStartDate, existingResEndDate)) {
                const existingResClassGroupDoc = await transaction.get(classGroupsCollection.doc(existingRes.classGroupId));
                if (!existingResClassGroupDoc.exists) continue;
                
                const existingResClassGroup = existingResClassGroupDoc.data() as ClassGroup;
                const commonClassDays = newReservationClassGroup.classDays.filter(day => existingResClassGroup.classDays?.includes(day));

                // Se houver conflito de dias na semana, a reserva não é permitida.
                if (commonClassDays.length > 0) {
                    throw new Error(`Conflito: A sala já está reservada para a turma "${existingResClassGroup.name}" em dias (${commonClassDays.join(', ')}) que se sobrepõem ao período selecionado.`);
                }
            }
        }

        // Se não houver conflitos, cria a nova reserva.
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

  } catch (error: any) {
    console.error('Failed to create recurring reservation:', error);
    return { success: false, message: error.message || 'Ocorreu um erro no servidor ao criar a reserva.' };
  }
}

/**
 * Deleta uma reserva recorrente do Firestore.
 */
export async function deleteRecurringReservation(id: string) {
  try {
    await recurringReservationsCollection.doc(id).delete();

    revalidatePath('/reservations');
    revalidatePath('/room-availability'); 
    return { success: true, message: 'Reserva recorrente excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete recurring reservation ${id}:`, error);
    return { success: false, message: 'Ocorreu um erro no servidor ao excluir a reserva.' };
  }
}
