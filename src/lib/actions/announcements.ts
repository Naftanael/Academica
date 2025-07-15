// src/lib/actions/announcements.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
// import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { db } from '@/lib/firebase/firebaseAdmin';
import { announcementSchema, type AnnouncementFormValues } from '@/lib/schemas/announcements';
import type { Announcement } from '@/types';

// const announcementsCollection = db.collection('announcements');

const docToAnnouncement = (doc: any): Announcement => {
    const data = doc.data();
    if (!data) throw new Error(`Document ${doc.id} has no data.`);

    const createdAt = data.createdAt as any; // Mock
    return {
        id: doc.id,
        title: data.title,
        content: data.content,
        author: data.author,
        type: data.type,
        priority: data.priority,
        published: data.published,
        createdAt: new Date().toISOString(),
    };
};

export async function getAnnouncements(): Promise<Announcement[]> {
  console.log("Firebase desativado: getAnnouncements retornando array vazio.");
  return [];
}

export async function getAnnouncementById(id: string): Promise<Announcement | undefined> {
  console.log(`Firebase desativado: getAnnouncementById para o ID ${id} retornando undefined.`);
  return undefined;
}

export async function createAnnouncement(prevState: any, values: AnnouncementFormValues) {
  console.log("Firebase desativado: createAnnouncement retornando erro.");
  const validatedValues = announcementSchema.safeParse(values);
  if (!validatedValues.success) {
      return { 
        success: false, 
        message: 'Erro de validação (Firebase desativado).', 
        errors: validatedValues.error.flatten().fieldErrors 
      };
    }
  return { success: false, message: 'Firebase está temporariamente desativado.' };
}

export async function updateAnnouncement(id: string, prevState: any, values: AnnouncementFormValues) {
  console.log(`Firebase desativado: updateAnnouncement para o ID ${id} retornando erro.`);
   const validatedValues = announcementSchema.safeParse(values);
    if (!validatedValues.success) {
      return { 
        success: false, 
        message: 'Erro de validação (Firebase desativado).', 
        errors: validatedValues.error.flatten().fieldErrors 
      };
    }
  return { success: false, message: 'Firebase está temporariamente desativado.' };
}

export async function deleteAnnouncement(id: string) {
  console.log(`Firebase desativado: deleteAnnouncement para o ID ${id} retornando erro.`);
  return { success: false, message: 'Firebase está temporariamente desativado.' };
}
