
/**
 * @file Manages all server-side actions for recurring reservations using Firestore.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firestore';
import { recurringReservationSchema } from '@/lib/schemas/recurring-reservations';
import type { ClassroomRecurringReservation, FirestoreTimestamp } from '@/types';

type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};


/**
 * Safely converts a Firestore timestamp to an ISO string.
 * @param timestamp The Firestore timestamp to convert.
 * @returns An ISO string if valid, otherwise null.
 */
function parseFirestoreTimestamp(timestamp: FirestoreTimestamp | undefined | null): string | null {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return null;
}


/**
 * Creates a new recurring reservation document in Firestore.
 */
export async function createRecurringReservation(prevState: FormState, formData: FormData): Promise<FormState> {
  // Use the Zod schema to validate and coerce form data.
  const validatedFields = recurringReservationSchema.safeParse({
    classGroupId: formData.get('classGroupId'),
    classroomId: formData.get('classroomId'),
    startDate: formData.get('startDate'),
    numberOfClasses: formData.get('numberOfClasses'), // Zod handles coercion to number
    purpose: formData.get('purpose'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'A validação dos dados falhou. Por favor, verifique os erros.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { startDate, ...rest } = validatedFields.data;

    // The data is valid, so we can prepare it for Firestore.
    // The `startDate` is already a Date object thanks to `z.coerce.date()`.
    const dataToSave = {
      ...rest,
      startDate, // Save the Date object directly
      // Note: endDate calculation logic would be implemented here in a real scenario.
    };

    await db.collection('recurring_reservations').add(dataToSave);

    revalidatePath('/reservations');
    return { success: true, message: 'Reserva recorrente criada com sucesso!' };
  } catch (error) {
    console.error('Erro ao criar a reserva recorrente:', error);
    return { success: false, message: 'Erro do Servidor: Não foi possível criar a reserva.' };
  }
}

/**
 * Fetches all recurring reservations from Firestore.
 */
export async function getRecurringReservations(): Promise<ClassroomRecurringReservation[]> {
    try {
        const snapshot = await db.collection('recurring_reservations').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Important: Use the safe timestamp parser
            const startDate = parseFirestoreTimestamp(data.startDate);

            return {
                id: doc.id,
                ...data,
                // Ensure the date is a valid ISO string or null
                startDate: startDate,
            } as ClassroomRecurringReservation;
        });
    } catch (error) {
        console.error('Erro ao buscar reservas recorrentes:', error);
        return [];
    }
}

/**
 * Deletes a recurring reservation document from Firestore.
 */
export async function deleteRecurringReservation(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'O ID da reserva é obrigatório.' };
  }
  try {
    await db.collection('recurring_reservations').doc(id).delete();
    revalidatePath('/reservations');
    return { success: true, message: 'Reserva recorrente deletada com sucesso.' };
  } catch (error) {
    console.error(`Erro ao deletar reserva recorrente com ID ${id}:`, error);
    return { success: false, message: 'Erro do Servidor: Falha ao deletar a reserva.' };
  }
}
