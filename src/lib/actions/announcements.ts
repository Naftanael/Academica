// src/lib/actions/announcements.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/database';
import { announcementSchema, announcementEditSchema, type AnnouncementFormValues, type AnnouncementEditFormValues } from '@/lib/schemas/announcements';
import type { Announcement } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const db = await getDb();
    const announcements = await db.all('SELECT * FROM announcements');
    return announcements;
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
    return [];
  }
}

export async function getAnnouncementById(id: string): Promise<Announcement | undefined> {
  try {
    const db = await getDb();
    const announcement = await db.get('SELECT * FROM announcements WHERE id = ?', id);
    return announcement;
  } catch (error) {
    console.error(`Failed to fetch announcement with ID ${id}:`, error);
    return undefined;
  }
}

export async function createAnnouncement(prevState: any, values: AnnouncementEditFormValues) {
  const validatedValues = announcementEditSchema.safeParse(values);
  if (!validatedValues.success) {
    return {
      success: false,
      message: 'Validation error.',
      errors: validatedValues.error.flatten().fieldErrors,
    };
  }

  try {
    const db = await getDb();
    const newAnnouncementId = uuidv4();
    await db.run(
      'INSERT INTO announcements (id, message, starts_at, ends_at) VALUES (?, ?, ?, ?)',
      newAnnouncementId,
      validatedValues.data.content, // "message" in db
      new Date().toISOString(), // mock starts_at
      new Date().toISOString() // mock ends_at
    );
    revalidatePath('/announcements');
    return { success: true, message: 'Announcement created successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}

export async function updateAnnouncement(id: string, prevState: any, values: AnnouncementEditFormValues) {
  const validatedValues = announcementEditSchema.safeParse(values);
  if (!validatedValues.success) {
    return {
      success: false,
      message: 'Validation error.',
      errors: validatedValues.error.flatten().fieldErrors,
    };
  }

  try {
    const db = await getDb();
    await db.run(
      'UPDATE announcements SET message = ? WHERE id = ?',
      validatedValues.data.content,
      id
    );
    revalidatePath('/announcements');
    revalidatePath(`/announcements/${id}/edit`);
    return { success: true, message: 'Announcement updated successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM announcements WHERE id = ?', id);
    revalidatePath('/announcements');
    return { success: true, message: 'Announcement deleted successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}
