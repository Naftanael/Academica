'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import { FieldValue, type DocumentSnapshot } from 'firebase-admin/firestore';
import type { Classroom } from '@/types';
import { classroomCreateSchema, classroomEditSchema, type ClassroomCreateValues, type ClassroomEditFormValues } from '@/lib/schemas/classrooms';

// Collection references
const classroomsCollection = db.collection('classrooms');
const classGroupsCollection = db.collection('classgroups');
const eventReservationsCollection = db.collection('event_reservations');
const recurringReservationsCollection = db.collection('recurring_reservations');

/**
 * Converts a Firestore document snapshot into a Classroom object.
 * Provides default values for optional fields to ensure type consistency.
 * @param doc - The Firestore document snapshot.
 * @returns The Classroom object.
 */
const docToClassroom = (doc: DocumentSnapshot): Classroom => {
    const data = doc.data();
    if (!data) {
        throw new Error("Document data is empty.");
    }
    return {
        id: doc.id,
        name: data.name,
        capacity: data.capacity,
        isLab: data.isLab ?? false,
        isUnderMaintenance: data.isUnderMaintenance ?? false,
        maintenanceReason: data.maintenanceReason ?? '',
        resources: data.resources ?? [],
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
    };
};

/**
 * Fetches all classrooms from Firestore, ordered by name.
 * @returns A promise that resolves to an array of Classroom objects.
 */
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const snapshot = await classroomsCollection.orderBy('name').get();
    return snapshot.docs.map(docToClassroom);
  } catch (error) {
    console.error('Failed to get classrooms:', error);
    // In case of error, return an empty array to prevent UI crashes.
    return [];
  }
}

/**
 * Fetches a single classroom by its ID.
 * @param id - The ID of the classroom to fetch.
 * @returns A promise that resolves to a Classroom object, or undefined if not found.
 */
export async function getClassroomById(id: string): Promise<Classroom | undefined> {
  try {
    const doc = await classroomsCollection.doc(id).get();
    if (!doc.exists) {
      return undefined;
    }
    return docToClassroom(doc);
  } catch (error) {
    console.error(`Failed to get classroom by ID ${id}:`, error);
    return undefined;
  }
}

/**
 * Creates a new classroom in Firestore.
 * Ensures that the classroom name is unique.
 * @param values - The data for the new classroom.
 * @returns An object indicating success or failure, with a message and optional data/errors.
 */
export async function createClassroom(values: ClassroomCreateValues) {
    try {
        const validatedValues = classroomCreateSchema.parse(values);

        const newClassroom = await db.runTransaction(async (transaction) => {
            const existingClassroomQuery = classroomsCollection.where('name', '==', validatedValues.name);
            const existingClassroomSnapshot = await transaction.get(existingClassroomQuery);

            if (!existingClassroomSnapshot.empty) {
                throw new Error('Já existe uma sala de aula com este nome.');
            }

            const newClassroomRef = classroomsCollection.doc();
            const newClassroomData = {
                ...validatedValues,
                // Set default values for optional fields if not provided
                isLab: validatedValues.isLab ?? false,
                isUnderMaintenance: validatedValues.isUnderMaintenance ?? false,
                maintenanceReason: validatedValues.maintenanceReason ?? '',
                resources: validatedValues.resources ?? [],
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };

            transaction.set(newClassroomRef, newClassroomData);
            return { id: newClassroomRef.id, ...newClassroomData };
        });

        // Revalidate caches to reflect the new data
        revalidatePath('/classrooms');
        revalidatePath('/room-availability');
        revalidatePath('/tv-display');
        revalidatePath('/');
        return { success: true, message: 'Sala de aula criada com sucesso!', data: newClassroom as Classroom };

    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Erro de validação ao criar sala.', errors: error.flatten().fieldErrors };
        }
        console.error('Failed to create classroom:', error);
        // Return the specific error message if available
        return { success: false, message: (error as Error).message || 'Erro interno ao criar sala de aula.' };
    }
}

/**
 * Updates an existing classroom.
 * @param id - The ID of the classroom to update.
 * @param values - The new data for the classroom.
 * @returns An object indicating success or failure, with a message and optional errors.
 */
export async function updateClassroom(id: string, values: ClassroomEditFormValues) {
    try {
        const validatedValues = classroomEditSchema.parse(values);
        const docRef = classroomsCollection.doc(id);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) {
                throw new Error('Sala de aula não encontrada.');
            }
            const existingData = doc.data();

            // Check for name uniqueness only if the name has changed
            if (validatedValues.name && validatedValues.name !== existingData?.name) {
                const existingNameQuery = classroomsCollection.where('name', '==', validatedValues.name).limit(1);
                const existingNameSnapshot = await transaction.get(existingNameQuery);
                if (!existingNameSnapshot.empty) {
                    throw new Error('Já existe uma sala de aula com este nome.');
                }
            }

            // Prepare the data for update, applying robust logic for maintenance status
            const updatedData: Record<string, any> = { ...validatedValues };

            const isNowUnderMaintenance = validatedValues.isUnderMaintenance;

            if (isNowUnderMaintenance === true) {
                // If being put under maintenance, ensure there's a reason
                updatedData.maintenanceReason = validatedValues.maintenanceReason || 'Manutenção geral.';
            } else if (isNowUnderMaintenance === false) {
                // If maintenance is being removed, clear the reason
                updatedData.maintenanceReason = '';
            }
            // If `isNowUnderMaintenance` is `undefined`, we don't change `maintenanceReason`.

            updatedData.updatedAt = FieldValue.serverTimestamp();
            transaction.update(docRef, updatedData);
        });

        revalidatePath('/classrooms');
        revalidatePath(`/classrooms/${id}/edit`);
        revalidatePath('/room-availability');
        revalidatePath('/tv-display');
        revalidatePath('/');
        return { success: true, message: 'Sala de aula atualizada com sucesso!' };

    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Erro de validação ao atualizar sala.', errors: error.flatten().fieldErrors };
        }
        console.error(`Failed to update classroom ${id}:`, error);
        return { success: false, message: (error as Error).message || 'Erro interno ao atualizar sala de aula.' };
    }
}

/**
 * Deletes a classroom.
 * Prevents deletion if the classroom is currently assigned to any class groups or reservations.
 * @param id - The ID of the classroom to delete.
 * @returns An object indicating success or failure with a message.
 */
export async function deleteClassroom(id: string) {
    try {
        await db.runTransaction(async (transaction) => {
            const docRef = classroomsCollection.doc(id);
            const doc = await transaction.get(docRef);

            if (!doc.exists) {
                // If it doesn't exist, our job is done.
                console.log(`Classroom ${id} not found for deletion, considering it a success.`);
                return;
            }

            // Check for dependencies before deleting
            const classGroupQuery = classGroupsCollection.where('assignedClassroomId', '==', id).limit(1);
            const eventReservationQuery = eventReservationsCollection.where('classroomId', '==', id).limit(1);
            const recurringReservationQuery = recurringReservationsCollection.where('classroomId', '==', id).limit(1);

            const [
                classGroupSnapshot,
                eventReservationSnapshot,
                recurringReservationSnapshot
            ] = await Promise.all([
                transaction.get(classGroupQuery),
                transaction.get(eventReservationQuery),
                transaction.get(recurringReservationQuery)
            ]);

            if (!classGroupSnapshot.empty) {
                throw new Error('Não é possível excluir a sala. Ela está atribuída a uma ou mais turmas.');
            }
            if (!eventReservationSnapshot.empty) {
                throw new Error('Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas de eventos.');
            }
            if (!recurringReservationSnapshot.empty) {
                throw new Error('Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas recorrentes.');
            }

            transaction.delete(docRef);
        });

        revalidatePath('/classrooms');
        revalidatePath('/room-availability');
        revalidatePath('/tv-display');
        revalidatePath('/reservations');
        revalidatePath('/');
        return { success: true, message: 'Sala de aula excluída com sucesso!' };

    } catch (error) {
        console.error(`Failed to delete classroom ${id}:`, error);
        return { success: false, message: (error as Error).message || 'Erro interno ao excluir sala de aula.' };
    }
}
