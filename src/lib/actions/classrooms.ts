
/**
 * @file Manages all server-side actions for classrooms using Firestore.
 * This file replaces the previous SQLite implementation with a fully Firestore-based one.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firestore'; // Import the central Firestore instance
import { classroomSchema } from '@/lib/schemas/classrooms';
import type { Classroom } from '@/types';

// The FormState remains the same, providing consistent feedback to the UI.
type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Creates a new classroom document in the 'classrooms' collection in Firestore.
 */
export async function createClassroom(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = classroomSchema.safeParse({
    name: formData.get('name'),
    capacity: Number(formData.get('capacity')),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { name, capacity } = validatedFields.data;

    // FIRESTORE LOGIC: Add a new document to the 'classrooms' collection.
    // Firestore automatically generates a unique ID for the new document.
    await db.collection('classrooms').add({
      name,
      capacity,
    });

    // Revalidate the cache for the classrooms page to show the new data.
    revalidatePath('/classrooms');
    return { success: true, message: 'Classroom created successfully!' };

  } catch (error) {
    console.error('Error creating classroom:', error);
    return { success: false, message: 'Server Error: Failed to create classroom.' };
  }
}

/**
 * Fetches all classroom documents from Firestore.
 * @returns A promise that resolves to an array of Classroom objects.
 */
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const snapshot = await db.collection('classrooms').orderBy('name', 'asc').get();
    if (snapshot.empty) {
      return [];
    }
    // Map Firestore documents to the Classroom type, including the document ID.
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      capacity: doc.data().capacity,
    })) as Classroom[];
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    return []; // Return an empty array on error to prevent crashes.
  }
}

/**
 * Fetches a single classroom by its ID from Firestore.
 * @param id - The ID of the classroom document.
 * @returns A promise that resolves to a Classroom object or null if not found.
 */
export async function getClassroomById(id: string): Promise<Classroom | null> {
    if (!id) return null;
    try {
        const docRef = db.collection('classrooms').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as Classroom;
    } catch (error) {
        console.error(`Error fetching classroom with ID ${id}:`, error);
        return null;
    }
}

/**
 * Updates a classroom document in Firestore.
 */
export async function updateClassroom(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = classroomSchema.safeParse({
        name: formData.get('name'),
        capacity: Number(formData.get('capacity')),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Validation failed. Please check the fields.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }
    
    try {
        const { name, capacity } = validatedFields.data;
        const docRef = db.collection('classrooms').doc(id);

        // FIRESTORE LOGIC: Update the document with the new data.
        await docRef.update({ name, capacity });

        revalidatePath('/classrooms');
        revalidatePath(`/classrooms/${id}/edit`);
        return { success: true, message: 'Classroom updated successfully.' };
    } catch (error) {
        console.error(`Error updating classroom with ID ${id}:`, error);
        return { success: false, message: 'Server Error: Failed to update classroom.' };
    }
}


/**
 * Deletes a classroom document from Firestore.
 */
export async function deleteClassroom(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'Classroom ID is required.' };
  }
  try {
    // Before deleting a classroom, check if it's being used by any classgroups.
    // This is a crucial validation to maintain data integrity.
    const classGroupsSnapshot = await db.collection('classgroups').where('classroomId', '==', id).limit(1).get();

    if (!classGroupsSnapshot.empty) {
      return { success: false, message: 'Cannot delete this classroom because it is currently assigned to one or more class groups. Please reassign them first.' };
    }

    // FIRESTORE LOGIC: Delete the document from the 'classrooms' collection.
    await db.collection('classrooms').doc(id).delete();

    revalidatePath('/classrooms');
    return { success: true, message: 'Classroom deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting classroom with ID ${id}:`, error);
    return { success: false, message: 'Server Error: Failed to delete classroom.' };
  }
}
