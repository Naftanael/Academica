// src/lib/actions/announcements.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/admin';
import type { Announcement } from '@/types';
import { announcementSchema, type AnnouncementFormValues } from '@/lib/schemas/announcements';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const announcementsCollection = db.collection('announcements');

// Helper function to convert Firestore doc to Announcement type
const docToAnnouncement = (doc: FirebaseFirestore.DocumentSnapshot): Announcement => {
    const data = doc.data();
    if (!data) {
        throw new Error("Document data is empty.");
    }
    const createdAt = data.createdAt as Timestamp;
    return {
        id: doc.id,
        title: data.title,
        content: data.content,
        createdAt: createdAt.toDate().toISOString(),
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

// Updated createAnnouncement to not rely on FormData
export async function createAnnouncement(prevState: any, values: AnnouncementFormValues) {
  try {
    const validatedValues = announcementSchema.parse(values);

    const newAnnouncementRef = announcementsCollection.doc();
    await newAnnouncementRef.set({
        ...validatedValues,
        createdAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/announcements');
    revalidatePath('/tv-display');
    return { 
        success: true, 
        message: 'Anúncio criado com sucesso!', 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create announcement in Firestore:', error);
    return { success: false, message: 'Erro interno ao criar anúncio.' };
  }
}

// Updated updateAnnouncement to match the new state shape
export async function updateAnnouncement(id: string, prevState: any, values: AnnouncementFormValues) {
  try {
    const validatedValues = announcementSchema.parse(values);
    const docRef = announcementsCollection.doc(id);

    await docRef.update(validatedValues);

    revalidatePath('/announcements');
    revalidatePath(`/announcements/${id}/edit`);
    revalidatePath('/tv-display');
    return { success: true, message: 'Anúncio atualizado com sucesso!' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error(`Failed to update announcement ${id} in Firestore:`, error);
    return { success: false, message: (error as Error).message || 'Erro interno ao atualizar anúncio.' };
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
