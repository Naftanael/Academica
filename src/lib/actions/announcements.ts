
/**
 * @file Manages all server-side actions for announcements using Firestore.
 */
'use server';

import { z } from 'zod';
import { db } from '@/lib/firestore';
import { announcementSchema } from '@/lib/schemas/announcements';
import type { Announcement } from '@/types';

type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Creates a new announcement document in Firestore.
 */
export async function createAnnouncement(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = announcementSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // The formData contains all fields including dataInicio and dataFim as strings
  // Access the raw data from formData for date parsing
  const rawDataInicio = formData.get('dataInicio');
  const rawDataFim = formData.get('dataFim');

  try {
    // Parse dataInicio and dataFim from the original form data
    const dataInicio = rawDataInicio ? new Date(rawDataInicio.toString()) : undefined;
    const dataFim = rawDataFim ? new Date(rawDataFim.toString()) : undefined;

    // Ensure dates are valid before creating the new announcement object
    if (dataInicio && isNaN(dataInicio.getTime())) {
      return { success: false, message: 'Invalid start date.' };
    }
    if (dataFim && isNaN(dataFim.getTime())) {
      return { success: false, message: 'Invalid end date.' };
    }

    const newAnnouncementData = {
      ...validatedFields.data, // Include other validated fields from schema
    };
    // FIRESTORE LOGIC: Add a new document with a server-side timestamp.
    await db.collection('announcements').add({
      createdAt: new Date(),
    });

    revalidatePath('/announcements');
    return { success: true, message: 'Announcement created successfully!' };
  } catch (error) {
    console.error('Error creating announcement:', error);
    return { success: false, message: 'Server Error: Failed to create announcement.' };
  }
}

/**
 * Fetches all announcements from Firestore.
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await db.collection('announcements').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            content: data.content, // Include content
            content: data.content,
            dataInicio: data.dataInicio.toDate(), // Convert Firestore Timestamp to Date
            dataFim: data.dataFim.toDate(), // Convert Firestore Timestamp to Date
            author: data.author,
            type: data.type,
            priority: data.priority,
            published: data.published,
            // Convert Firestore Timestamp to Date
            createdAt: data.createdAt.toDate().toISOString(),
        };
    }) as Announcement[];
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

/**
 * Fetches a single announcement by its ID from Firestore.
 */
export async function getAnnouncementById(id: string): Promise<Announcement | null> {
    if (!id) return null;
    try {
        const docSnap = await db.collection('announcements').doc(id).get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data();
        if (!data) {
            return null;
        }
        return { 
            id: docSnap.id, 
            title: data.title, // Include title
            content: data.content, // Include content
            dataInicio: data.dataInicio.toDate ? data.dataInicio.toDate() : data.dataInicio, // Handle potential non-timestamp dates
            createdAt: data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt, // Handle potential non-timestamp dates
        } as Announcement;
    } catch (error) {
        console.error(`Error fetching announcement with ID ${id}:`, error);
        return null;
    }
}


/**
 * Updates an announcement document in Firestore.
 */
export async function updateAnnouncement(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = announcementSchema.safeParse({
        title: formData.get('title'),
        content: formData.get('content'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Validation failed.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        // Access the raw data from formData for date parsing
        const rawDataInicio = formData.get('dataInicio');
        const rawDataFim = formData.get('dataFim');

        // Parse dataInicio and dataFim from the original form data
        const dataInicio = rawDataInicio ? new Date(rawDataInicio.toString()) : undefined;
        const dataFim = rawDataFim ? new Date(rawDataFim.toString()) : undefined;

        await db.collection('announcements').doc(id).update({
            ...validatedFields.data,
            dataInicio: dataInicio,
            dataFim: dataFim,
        });
        revalidatePath('/announcements');
        revalidatePath(`/announcements/${id}/edit`);
        return { success: true, message: 'Announcement updated successfully.' };
    } catch (error) {
        console.error(`Error updating announcement with ID ${id}:`, error);
        return { success: false, message: 'Server Error: Failed to update announcement.' };
    }
}


/**
 * Deletes an announcement document from Firestore.
 */
export async function deleteAnnouncement(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'Announcement ID is required.' };
  }
  try {
    await db.collection('announcements').doc(id).delete();
    revalidatePath('/announcements');
    return { success: true, message: 'Announcement deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting announcement with ID ${id}:`, error);
    return { success: false, message: 'Server Error: Failed to delete announcement.' };
  }
}
