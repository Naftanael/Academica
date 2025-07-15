// src/lib/actions/classrooms.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import { classroomSchema, classroomSchemaWithoutRefinement } from '@/lib/schemas/classrooms';
import { Classroom } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

const classroomsCollection = db.collection('classrooms');

/**
 * Converts a Firestore document snapshot into a Classroom object.
 * @param doc - The document snapshot from Firestore.
 * @returns A Classroom object with its ID.
 */
function toClassroom(doc: FirebaseFirestore.DocumentSnapshot): Classroom {
  const data = doc.data();
  if (!data) {
    throw new Error('Document data is unexpectedly empty.');
  }
  return {
    id: doc.id,
    name: data.name,
    capacity: data.capacity,
    isUnderMaintenance: data.isUnderMaintenance,
    maintenanceReason: data.maintenanceReason,
  };
}

/**
 * Creates a new classroom in Firestore.
 * @param prevState - The previous state of the form.
 * @param formData - The form data containing the classroom details.
 * @returns An object with a message indicating success or failure.
 */
export async function createClassroom(prevState: any, formData: FormData) {
  const validatedFields = classroomSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await classroomsCollection.add({
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(), // Best practice to track creation
    });
    revalidatePath('/classrooms');
    return { message: 'Sala de aula criada com sucesso!' };
  } catch (error) {
    console.error('Error creating classroom:', error);
    return { message: 'Erro ao criar a sala de aula.' };
  }
}

/**
 * Fetches all classrooms from Firestore, ordered by name.
 * @returns A promise that resolves to an array of Classroom objects.
 */
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const snapshot = await classroomsCollection.orderBy('name', 'asc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(toClassroom);
  } catch (error) {
    console.error('Error getting documents: ', error);
    return [];
  }
}

/**
 * Fetches a single classroom by its ID.
 * @param id - The ID of the classroom to fetch.
 * @returns A promise that resolves to the Classroom object or null if not found.
 */
export async function getClassroomById(id: string): Promise<Classroom | null> {
  if (!id) {
    console.error('getClassroomById: ID is required.');
    return null;
  }
  try {
    const doc = await classroomsCollection.doc(id).get();
    if (!doc.exists) {
      console.warn(`No classroom found with id: ${id}`);
      return null;
    }
    return toClassroom(doc);
  } catch (error) {
    console.error(`Error fetching classroom ${id}:`, error);
    return null;
  }
}

/**
 * Updates an existing classroom in Firestore.
 * @param id - The ID of the classroom to update.
 * @param prevState - The previous state of the form.
 * @param formData - The form data containing the updated classroom details.
 * @returns An object with a message indicating success or failure.
 */
export async function updateClassroom(id: string, prevState: any, formData: FormData) {
  const validatedFields = classroomSchemaWithoutRefinement.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const classroomRef = classroomsCollection.doc(id);
    await classroomRef.update({
      ...validatedFields.data,
      updatedAt: FieldValue.serverTimestamp(), // Best practice to track updates
    });
    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);
    return { message: 'Sala de aula atualizada com sucesso!' };
  } catch (error) {
    console.error('Error updating classroom:', error);
    return { message: 'Erro ao atualizar a sala de aula.' };
  }
}

/**
 * Deletes a classroom from Firestore.
 * @param id - The ID of the classroom to delete.
 * @returns A promise that resolves when the classroom is deleted.
 */
export async function deleteClassroom(id: string) {
  try {
    await classroomsCollection.doc(id).delete();
    revalidatePath('/classrooms');
    return { message: 'Sala de aula deletada com sucesso' };
  } catch (error) {
    console.error('Error deleting classroom:', error);
    return { message: 'Erro ao deletar a sala de aula' };
  }
}
