
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { Announcement } from '@/types';
import { announcementSchema, type AnnouncementFormValues } from '@/lib/schemas/announcements';
import { formatISO } from 'date-fns';

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const announcements = await readData<Announcement>('announcements.json');
    // Sort by creation date, newest first
    return announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Failed to get announcements:', error);
    return [];
  }
}

export async function getAnnouncementById(id: string): Promise<Announcement | undefined> {
  try {
    const announcements = await getAnnouncements();
    return announcements.find(a => a.id === id);
  } catch (error) {
    console.error(`Failed to get announcement by ID ${id}:`, error);
    return undefined;
  }
}

export async function createAnnouncement(values: AnnouncementFormValues) {
  try {
    const validatedValues = announcementSchema.parse(values);
    const announcements = await readData<Announcement>('announcements.json');

    const newAnnouncement: Announcement = {
      id: generateId(),
      ...validatedValues,
      createdAt: formatISO(new Date()),
    };

    announcements.push(newAnnouncement);
    await writeData('announcements.json', announcements);

    revalidatePath('/announcements');
    return { success: true, message: 'Anúncio criado com sucesso!', data: newAnnouncement };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create announcement:', error);
    return { success: false, message: 'Erro interno ao criar anúncio.' };
  }
}

export async function updateAnnouncement(id: string, values: AnnouncementFormValues) {
  try {
    const validatedValues = announcementSchema.parse(values);
    const announcements = await readData<Announcement>('announcements.json');
    const index = announcements.findIndex(a => a.id === id);

    if (index === -1) {
      return { success: false, message: 'Anúncio não encontrado.' };
    }

    announcements[index] = {
      ...announcements[index],
      ...validatedValues,
    };

    await writeData('announcements.json', announcements);
    revalidatePath('/announcements');
    revalidatePath(`/announcements/${id}/edit`);
    return { success: true, message: 'Anúncio atualizado com sucesso!', data: announcements[index] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error(`Failed to update announcement ${id}:`, error);
    return { success: false, message: 'Erro interno ao atualizar anúncio.' };
  }
}


export async function deleteAnnouncement(id: string) {
  try {
    let announcements = await readData<Announcement>('announcements.json');
    announcements = announcements.filter(a => a.id !== id);
    await writeData('announcements.json', announcements);
    
    revalidatePath('/announcements');
    return { success: true, message: 'Anúncio excluído com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete announcement ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir anúncio.' };
  }
}
