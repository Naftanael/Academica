// src/lib/actions/classrooms.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

import { db } from '@/lib/firebase/admin';
import { classroomSchema } from '@/lib/schemas/classrooms';
import type { Classroom } from '@/types';

const classroomsCollection = db.collection('classrooms');

// Helper para converter um documento do Firestore para o tipo Classroom.
const toClassroom = (doc: FirebaseFirestore.DocumentSnapshot): Classroom => {
  const data = doc.data();
  if (!data) throw new Error(`Document ${doc.id} has no data.`);
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

// Tipo reutilizável para o estado do formulário em Server Actions.
type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Cria uma nova sala de aula no Firestore.
 */
export async function createClassroom(prevState: any, values: z.infer<typeof classroomSchema>): Promise<FormState> {
  const validatedFields = classroomSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos com atenção.',
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
    return { success: false, message: 'Ocorreu um erro no servidor. Tente novamente mais tarde.' };
  }
}

/**
 * Busca todas as salas de aula do Firestore, ordenadas por nome.
 * Lança um erro em caso de falha na comunicação com o banco de dados.
 */
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const snapshot = await classroomsCollection.orderBy('name', 'asc').get();
    return snapshot.docs.map(toClassroom);
  } catch (error) {
    console.error('Error fetching classrooms: ', error);
    throw new Error('Failed to retrieve classrooms.');
  }
}

/**
 * Busca uma sala de aula específica pelo seu ID.
 * Retorna null se não encontrada. Lança erro em caso de falha no banco de dados.
 */
export async function getClassroomById(id: string): Promise<Classroom | null> {
  if (!id) return null;
  try {
    const doc = await classroomsCollection.doc(id).get();
    return doc.exists ? toClassroom(doc) : null;
  } catch (error) {
    console.error(`Error fetching classroom ${id}:`, error);
    throw new Error(`Failed to retrieve classroom ${id}.`);
  }
}

/**
 * Atualiza uma sala de aula existente no Firestore.
 */
export async function updateClassroom(id: string, prevState: any, values: z.infer<typeof classroomSchema>): Promise<FormState> {
  const validatedFields = classroomSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos com atenção.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await classroomsCollection.doc(id).update({
      ...validatedFields.data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);
    return { success: true, message: 'Sala de aula atualizada com sucesso!' };
  } catch (error) {
    console.error(`Error updating classroom ${id}:`, error);
    return { success: false, message: 'Ocorreu um erro no servidor ao atualizar.' };
  }
}

/**
 * Deleta uma sala de aula do Firestore, verificando antes se não está em uso.
 */
export async function deleteClassroom(id: string): Promise<{ success: boolean; message: string }> {
  try {
    // Verifica se a sala está atribuída a alguma turma antes de deletar.
    const classGroupsQuery = await db.collection('classgroups').where('assignedClassroomId', '==', id).limit(1).get();

    if (!classGroupsQuery.empty) {
        return { success: false, message: 'Não é possível excluir. A sala está atribuída a uma ou mais turmas.' };
    }

    await classroomsCollection.doc(id).delete();
    revalidatePath('/classrooms');
    return { success: true, message: 'Sala de aula excluída com sucesso.' };
  } catch (error) {
    console.error(`Error deleting classroom ${id}:`, error);
    return { success: false, message: 'Ocorreu um erro no servidor ao excluir.' };
  }
}
