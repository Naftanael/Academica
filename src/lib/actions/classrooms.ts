// src/lib/actions/classrooms.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import type { Classroom } from '@/types';
import { classroomSchema } from '@/lib/schemas/classrooms';
import { FieldValue } from 'firebase-admin/firestore';

const classroomsCollection = db.collection('classrooms');

// Helper function to convert Firestore doc to Classroom type
const toClassroom = (doc: FirebaseFirestore.DocumentSnapshot): Classroom => {
  const data = doc.data();
  if (!data) throw new Error('Document data is empty.');
  return {
    id: doc.id,
    name: data.name,
    capacity: data.capacity,
    isUnderMaintenance: data.isUnderMaintenance || false,
    maintenanceReason: data.maintenanceReason || '',
    resources: data.resources || [],
    isLab: data.isLab || false,
  };
};

// Type for the form state
type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Creates a new classroom in Firestore using Server Actions.
 * @param prevState - The previous state of the form.
 * @param values - The validated classroom data from the form.
 * @returns A FormState object indicating success or failure.
 */
export async function createClassroom(prevState: any, values: z.infer<typeof classroomSchema>): Promise<FormState> {
  const validatedFields = classroomSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name } = validatedFields.data;

  try {
    const existingClassroomQuery = await classroomsCollection.where('name', '==', name).limit(1).get();
    if (!existingClassroomQuery.empty) {
      return { success: false, message: 'Já existe uma sala de aula com este nome.' };
    }

    await classroomsCollection.add({
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/classrooms');
    return { success: true, message: 'Sala de aula criada com sucesso!' };
  } catch (error) {
    console.error('Error creating classroom:', error);
    return { success: false, message: 'Erro de servidor ao criar a sala de aula.' };
  }
}

/**
 * Fetches all classrooms from Firestore, ordered by name.
 * @returns A promise that resolves to an array of Classroom objects.
 */
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const snapshot = await classroomsCollection.orderBy('name', 'asc').get();
    return snapshot.docs.map(toClassroom);
  } catch (error) {
    console.error('Error getting classrooms: ', error);
    return [];
  }
}

/**
 * Fetches a single classroom by its ID.
 * @param id - The ID of the classroom to fetch.
 * @returns A promise that resolves to the Classroom object or null if not found.
 */
export async function getClassroomById(id: string): Promise<Classroom | null> {
  if (!id) return null;
  try {
    const doc = await classroomsCollection.doc(id).get();
    return doc.exists ? toClassroom(doc) : null;
  } catch (error) {
    console.error(`Error fetching classroom ${id}:`, error);
    return null;
  }
}

/**
 * Updates an existing classroom in Firestore using Server Actions.
 * @param id - The ID of the classroom to update.
 * @param prevState - The previous state of the form.
 * @param values - The validated classroom data from the form.
 * @returns A FormState object indicating success or failure.
 */
export async function updateClassroom(id: string, prevState: any, values: z.infer<typeof classroomSchema>): Promise<FormState> {
  const validatedFields = classroomSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const classroomRef = classroomsCollection.doc(id);
    await classroomRef.update({
      ...validatedFields.data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);
    return { success: true, message: 'Sala de aula atualizada com sucesso!' };
  } catch (error) {
    console.error(`Error updating classroom ${id}:`, error);
    return { success: false, message: 'Erro de servidor ao atualizar a sala de aula.' };
  }
}

/**
 * Deletes a classroom from Firestore.
 * @param id - The ID of the classroom to delete.
 * @returns An object with a message indicating success or failure.
 */
export async function deleteClassroom(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const querySnapshot = await db.collection('classgroups').where('assignedClassroomId', '==', id).limit(1).get();

    if (!querySnapshot.empty) {
        return { success: false, message: 'Não é possível excluir. A sala está atribuída a uma ou mais turmas.' };
    }

    await classroomsCollection.doc(id).delete();
    revalidatePath('/classrooms');
    return { success: true, message: 'Sala de aula excluída com sucesso.' };
  } catch (error) {
    console.error(`Error deleting classroom ${id}:`, error);
    return { success: false, message: 'Erro de servidor ao excluir a sala de aula.' };
  }
}
