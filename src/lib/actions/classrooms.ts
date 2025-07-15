// src/lib/actions/classrooms.ts
/**
 * @file Define as "Server Actions" para gerenciar as salas de aula.
 * Este arquivo contém toda a lógica de negócios para criar, ler, atualizar
 * e deletar salas de aula no banco de dados.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase/firebaseAdmin';
import { classroomSchema } from '@/lib/schemas/classrooms';
import type { Classroom } from '@/types';

// Define a coleção do Firestore para salas de aula.
const classroomsCollection = db.collection('classrooms');

/**
 * Converte um documento do Firestore para o tipo Classroom.
 * Esta função ajuda a garantir que os dados do Firestore sejam
 * consistentes com o tipo definido na aplicação.
 *
 * @param {any} doc - O documento do Firestore.
 * @returns {Classroom} - O objeto Classroom.
 */
const toClassroom = (doc: any): Classroom => {
  const data = doc.data();
  if (!data) {
    throw new Error(`O documento ${doc.id} não possui dados.`);
  }
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

/**
 * Define o estado do formulário para as ações de criar e atualizar.
 * Isso permite que o formulário exiba mensagens de sucesso, erro e
 * validação dos campos.
 */
type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Cria uma nova sala de aula.
 *
 * @param {any} prevState - O estado anterior do formulário (não utilizado).
 * @param {z.infer<typeof classroomSchema>} values - Os dados da nova sala de aula.
 * @returns {Promise<FormState>} - O estado do formulário após a operação.
 */
export async function createClassroom(
  prevState: any,
  values: z.infer<typeof classroomSchema>,
): Promise<FormState> {
  console.log("DEBUG: Iniciando a criação de uma nova sala de aula com os valores:", values);

  // Valida os campos do formulário com o Zod.
  const validatedFields = classroomSchema.safeParse(values);
  if (!validatedFields.success) {
    console.warn("DEBUG: Erro de validação ao criar a sala de aula.");
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos e tente novamente.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Adiciona a nova sala de aula ao Firestore.
    const newClassroom = await classroomsCollection.add(validatedFields.data);
    console.log("DEBUG: Sala de aula criada com sucesso com o ID:", newClassroom.id);
    
    // Revalida o cache da página de salas de aula para exibir a nova sala.
    revalidatePath('/classrooms');

    return { success: true, message: 'Sala de aula criada com sucesso!' };
  } catch (error: any) {
    console.error("ERRO: Falha ao criar a sala de aula:", error);
    return { success: false, message: `Ocorreu um erro no servidor: ${error.message}` };
  }
}

/**
 * Busca todas as salas de aula.
 *
 * @returns {Promise<Classroom[]>} - Uma lista de todas as salas de aula.
 */
export async function getClassrooms(): Promise<Classroom[]> {
  console.log("DEBUG: Buscando todas as salas de aula...");
  try {
    const snapshot = await classroomsCollection.get();
    const classrooms = snapshot.docs.map(toClassroom);
    console.log(`DEBUG: ${classrooms.length} salas de aula encontradas.`);
    return classrooms;
  } catch (error: any) {
    console.error("ERRO: Falha ao buscar as salas de aula:", error);
    return [];
  }
}

/**
 * Busca uma sala de aula pelo seu ID.
 *
 * @param {string} id - O ID da sala de aula.
 * @returns {Promise<Classroom | null>} - A sala de aula encontrada ou null.
 */
export async function getClassroomById(id: string): Promise<Classroom | null> {
  console.log(`DEBUG: Buscando a sala de aula com o ID: ${id}`);
  try {
    const doc = await classroomsCollection.doc(id).get();
    if (!doc.exists) {
      console.warn(`DEBUG: Nenhuma sala de aula encontrada com o ID: ${id}`);
      return null;
    }
    const classroom = toClassroom(doc);
    console.log("DEBUG: Sala de aula encontrada:", classroom);
    return classroom;
  } catch (error: any) {
    console.error(`ERRO: Falha ao buscar a sala de aula com o ID ${id}:`, error);
    return null;
  }
}

/**
 * Atualiza uma sala de aula existente.
 *
 * @param {string} id - O ID da sala de aula a ser atualizada.
 * @param {any} prevState - O estado anterior do formulário (não utilizado).
 * @param {z.infer<typeof classroomSchema>} values - Os novos dados da sala de aula.
 * @returns {Promise<FormState>} - O estado do formulário após a operação.
 */
export async function updateClassroom(
  id: string,
  prevState: any,
  values: z.infer<typeof classroomSchema>,
): Promise<FormState> {
  console.log(`DEBUG: Iniciando a atualização da sala de aula com o ID: ${id}`, values);

  // Valida os campos do formulário com o Zod.
  const validatedFields = classroomSchema.safeParse(values);
  if (!validatedFields.success) {
    console.warn("DEBUG: Erro de validação ao atualizar a sala de aula.");
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos e tente novamente.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Atualiza a sala de aula no Firestore.
    await classroomsCollection.doc(id).update(validatedFields.data);
    console.log(`DEBUG: Sala de aula com o ID ${id} atualizada com sucesso.`);

    // Revalida o cache para refletir as alterações.
    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);

    return { success: true, message: 'Sala de aula atualizada com sucesso!' };
  } catch (error: any) {
    console.error(`ERRO: Falha ao atualizar a sala de aula com o ID ${id}:`, error);
    return { success: false, message: `Ocorreu um erro no servidor: ${error.message}` };
  }
}

/**
 * Deleta uma sala de aula.
 *
 * @param {string} id - O ID da sala de aula a ser deletada.
 * @returns {Promise<{ success: boolean; message: string }>} - O resultado da operação.
 */
export async function deleteClassroom(
  id: string,
): Promise<{ success: boolean; message: string }> {
  console.log(`DEBUG: Iniciando a deleção da sala de aula com o ID: ${id}`);
  try {
    // Deleta a sala de aula do Firestore.
    await classroomsCollection.doc(id).delete();
    console.log(`DEBUG: Sala de aula com o ID ${id} deletada com sucesso.`);
    
    // Revalida o cache para remover a sala da lista.
    revalidatePath('/classrooms');

    return { success: true, message: 'Sala de aula deletada com sucesso!' };
  } catch (error: any) {
    console.error(`ERRO: Falha ao deletar a sala de aula com o ID ${id}:`, error);
    return { success: false, message: `Ocorreu um erro no servidor: ${error.message}` };
  }
}
