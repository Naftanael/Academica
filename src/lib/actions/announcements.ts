// src/lib/actions/announcements.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { db } from '@/lib/firebase/admin'; // A importação garante a inicialização. Se falhar, a app para.
import { announcementSchema, type AnnouncementFormValues } from '@/lib/schemas/announcements';
import type { Announcement } from '@/types';

// A coleção é inicializada diretamente. Se 'db' não estivesse disponível, o app teria falhado ao iniciar.
const announcementsCollection = db.collection('announcements');

// Helper para converter um documento do Firestore para o nosso tipo Announcement.
const docToAnnouncement = (doc: FirebaseFirestore.DocumentSnapshot): Announcement => {
    const data = doc.data();
    // Um doc retornado pelo Firestore sempre terá dados.
    if (!data) throw new Error(`Document ${doc.id} has no data.`);

    const createdAt = data.createdAt as Timestamp;
    return {
        id: doc.id,
        title: data.title,
        content: data.content,
        author: data.author,
        type: data.type,
        priority: data.priority,
        published: data.published,
        createdAt: createdAt.toDate().toISOString(),
    };
};

/**
 * Busca todos os anúncios do Firestore, ordenados por data de criação.
 * Lança um erro se a busca no banco de dados falhar.
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await announcementsCollection.orderBy('createdAt', 'desc').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(docToAnnouncement);
  } catch (error) {
    console.error('Error fetching announcements from Firestore:', error);
    // Lançar o erro permite que a camada superior (ex: um Error Boundary no React) o capture.
    throw new Error('Failed to retrieve announcements.');
  }
}

/**
 * Busca um anúncio específico pelo seu ID.
 * Retorna undefined se o documento não for encontrado.
 * Lança um erro se a busca no banco de dados falhar.
 */
export async function getAnnouncementById(id: string): Promise<Announcement | undefined> {
  try {
    const doc = await announcementsCollection.doc(id).get();
    return doc.exists ? docToAnnouncement(doc) : undefined;
  } catch (error) {
    console.error(`Error fetching announcement by ID ${id} from Firestore:`, error);
    throw new Error(`Failed to retrieve announcement ${id}.`);
  }
}

/**
 * Cria um novo anúncio no Firestore.
 * Utiliza o 'prevState' do useFormState para retornar o estado da operação.
 */
export async function createAnnouncement(prevState: any, values: AnnouncementFormValues) {
  try {
    const validatedValues = announcementSchema.parse(values);

    await announcementsCollection.add({
        ...validatedValues,
        createdAt: FieldValue.serverTimestamp(),
    });

    // Invalida o cache para as páginas que exibem os anúncios.
    revalidatePath('/announcements');
    revalidatePath('/tv-display');

    return { success: true, message: 'Anúncio criado com sucesso!' };
  } catch (error) {
    // Tratamento específico para erros de validação do Zod.
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: 'Erro de validação nos dados do anúncio.', 
        errors: error.flatten().fieldErrors 
      };
    }
    console.error('Failed to create announcement in Firestore:', error);
    return { success: false, message: 'Ocorreu um erro no servidor ao criar o anúncio.' };
  }
}

/**
 * Atualiza um anúncio existente no Firestore.
 */
export async function updateAnnouncement(id: string, prevState: any, values: AnnouncementFormValues) {
  try {
    const validatedValues = announcementSchema.parse(values);
    const docRef = announcementsCollection.doc(id);

    await docRef.update({
      ...validatedValues,
      updatedAt: FieldValue.serverTimestamp() // Adiciona um campo de 'updatedAt' para rastreamento.
    });

    revalidatePath('/announcements');
    revalidatePath(`/announcements/${id}/edit`);
    revalidatePath('/tv-display');

    return { success: true, message: 'Anúncio atualizado com sucesso!' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        message: 'Erro de validação nos dados do anúncio.', 
        errors: error.flatten().fieldErrors 
      };
    }
    console.error(`Failed to update announcement ${id} in Firestore:`, error);
    return { success: false, message: 'Ocorreu um erro no servidor ao atualizar o anúncio.' };
  }
}

/**
 * Deleta um anúncio do Firestore.
 */
export async function deleteAnnouncement(id: string) {
  try {
    await announcementsCollection.doc(id).delete();
    
    revalidatePath('/announcements');
    revalidatePath('/tv-display');

    return { success: true, message: 'Anúncio excluído com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete announcement ${id} from Firestore:`, error);
    return { success: false, message: 'Ocorreu um erro no servidor ao excluir o anúncio.' };
  }
}
