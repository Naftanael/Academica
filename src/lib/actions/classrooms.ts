/**
 * @file Este arquivo define as "Server Actions" para gerenciar as salas de aula.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
// import { FieldValue } from 'firebase-admin/firestore';

import { db } from '@/lib/firebase/firebaseAdmin';
import { classroomSchema } from '@/lib/schemas/classrooms';
import type { Classroom } from '@/types';

// const classroomsCollection = db.collection('classrooms');

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

type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createClassroom(
  prevState: any,
  values: z.infer<typeof classroomSchema>,
): Promise<FormState> {
  console.log("Firebase desativado: createClassroom retornando erro.");
  const validatedFields = classroomSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação (Firebase desativado).',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  return { success: false, message: 'Ocorreu um erro inesperado no servidor.' };
}

export async function getClassrooms(): Promise<Classroom[]> {
  console.log("Firebase desativado: getClassrooms retornando array vazio.");
  return [];
}

export async function getClassroomById(id: string): Promise<Classroom | null> {
  console.log(`Firebase desativado: getClassroomById para o ID ${id} retornando null.`);
  return null;
}

export async function updateClassroom(
  id: string,
  prevState: any,
  values: z.infer<typeof classroomSchema>,
): Promise<FormState> {
  console.log(`Firebase desativado: updateClassroom para o ID ${id} retornando erro.`);
   const validatedFields = classroomSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação (Firebase desativado).',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  return { success: false, message: 'Ocorreu um erro inesperado no servidor.' };
}

export async function deleteClassroom(
  id: string,
): Promise<{ success: boolean; message: string }> {
  console.log(`Firebase desativado: deleteClassroom para o ID ${id} retornando erro.`);
  return { success: false, message: 'Ocorreu um erro inesperado no servidor.' };
}
