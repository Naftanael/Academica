'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import type { Announcement } from '@/types';
import { announcementSchema, type AnnouncementFormValues } from '@/lib/schemas/announcements';
import { Timestamp } from 'firebase-admin/firestore';

const announcementsCollection = db.collection('announcements');

// Helper function to convert Firestore doc to Announcement type
// Handles the conversion of Firestore Timestamp to a string.
const docToAnnouncement = (doc: FirebaseFirestore.DocumentSnapshot): Announcement => {
    const data = doc.data() as Omit<Announcement, 'id' | 'createdAt'> & { createdAt: Timestamp };
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate().toISOString(),
    };
};

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await announcementsCollection.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(docToAnnouncement);
  } catch (error) {
    console.error('Failed to get announcements from Firestore:', error);
    // Returning an empty array to prevent crashing the UI
    return [];
  }
}

export async function getAnnouncementById(id: string): Promise<Announcement | undefined> {
  try {
    const doc = await announcementsCollection.doc(id).get();
    if (!doc.exists) {
      return undefined;
    }
    return docToAnnouncement(doc);
  } catch (error) {
    console.error(`Failed to get announcement by ID ${id} from Firestore:`, error);
    return undefined;
  }
}

export async function createAnnouncement(values: AnnouncementFormValues) {
  try {
    const validatedValues = announcementSchema.parse(values);

    const newAnnouncementData = {
      ...validatedValues,
      createdAt: Timestamp.now(), // Use Firestore server timestamp
    };

    const docRef = await announcementsCollection.add(newAnnouncementData);
    
    // Fetch the newly created document to return it with the ID and proper timestamp
    const newDoc = await docRef.get();
    const newAnnouncement = docToAnnouncement(newDoc);

    revalidatePath('/announcements');
    revalidatePath('/tv-display');
    return { success: true, message: 'Anúncio criado com sucesso!', data: newAnnouncement };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create announcement in Firestore:', error);
    return { success: false, message: 'Erro interno ao criar anúncio.' };
  }
}

export async function updateAnnouncement(id: string, values: AnnouncementFormValues) {
  try {
    const validatedValues = announcementSchema.parse(values);
    const docRef = announcementsCollection.doc(id);
    
    // Check if the document exists before updating
    const doc = await docRef.get();
    if (!doc.exists) {
        return { success: false, message: 'Anúncio não encontrado.' };
    }

    // Firestore's update will only change the fields provided.
    // We don't need to merge with existing data here.
    // Note: We are not updating `createdAt`
    await docRef.update(validatedValues);
    
    // Fetch the updated document to return it
    const updatedDoc = await docRef.get();
    const updatedAnnouncement = docToAnnouncement(updatedDoc);

    revalidatePath('/announcements');
    revalidatePath(`/announcements/${id}/edit`);
    revalidatePath('/tv-display');
    return { success: true, message: 'Anúncio atualizado com sucesso!', data: updatedAnnouncement };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error(`Failed to update announcement ${id} in Firestore:`, error);
    return { success: false, message: 'Erro interno ao atualizar anúncio.' };
  }
}


export async function deleteAnnouncement(id: string) {
  try {
    await announcementsCollection.doc(id).delete();
    
    revalidatePath('/announcements');
    revalidatePath('/tv-display');
    return { success: true, message: 'Anúncio excluído com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete announcement ${id} from Firestore:`, error);
    return { success: false, message: 'Erro interno ao excluir anúncio.' };
  }
}
