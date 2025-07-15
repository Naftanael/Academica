/**
 * @file Este arquivo define as "Server Actions" para gerenciar as salas de aula.
 */
'use server';

import { z } from 'zod'; 
import { revalidatePath } from 'next/cache'; 
// import { FieldValue } from 'firebase-admin/firestore'; 

// import { db } from '@/lib/firebase/firebaseAdmin'; 
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
    return { success: false, message: 'Firebase está temporariamente desativado.' };
//   const validatedFields = classroomSchema.safeParse(values);

//   if (!validatedFields.success) {
//     return {
//       success: false,
//       message:
//         'Erro de validação. Por favor, verifique os campos do formulário.',
//       errors: validatedFields.error.flatten().fieldErrors,
//     };
//   }

//   const { name } = validatedFields.data;

//   try {
//     const existingClassroomQuery = await classroomsCollection
//       .where('name', '==', name)
//       .limit(1)
//       .get();
//     if (!existingClassroomQuery.empty) {
//       return {
//         success: false,
//         message: 'Já existe uma sala de aula com este nome.',
//       };
//     }

//     await classroomsCollection.add({
//       ...validatedFields.data,
//       createdAt: FieldValue.serverTimestamp(),
//     });

//     revalidatePath('/classrooms');

//     return { success: true, message: 'Sala de aula criada com sucesso!' };
//   } catch (error) {
//     console.error('Erro ao criar a sala de aula:', error);
//     return {
//       success: false,
//       message: 'Ocorreu um erro inesperado no servidor. Tente novamente.',
//     };
//   }
}

export async function getClassrooms(): Promise<Classroom[]> {
    console.log("Firebase desativado: getClassrooms retornando array vazio.");
    return [];
//   try {
//     const snapshot = await classroomsCollection.orderBy('name', 'asc').get();
//     return snapshot.docs.map(toClassroom);
//   } catch (error) {
//     console.error('Erro ao buscar as salas de aula:', error);
//     throw new Error('Falha ao buscar os dados das salas de aula.');
//   }
}

export async function getClassroomById(id: string): Promise<Classroom | null> {
    console.log(`Firebase desativado: getClassroomById para o ID ${id} retornando null.`);
    return null;
//   if (!id) return null;

//   try {
//     const doc = await classroomsCollection.doc(id).get();
//     return doc.exists ? toClassroom(doc) : null;
//   } catch (error) {
//     console.error(`Erro ao buscar a sala de aula com ID ${id}:`, error);
//     throw new Error(`Falha ao buscar os dados da sala de aula ${id}.`);
//   }
}

export async function updateClassroom(
  id: string,
  prevState: any,
  values: z.infer<typeof classroomSchema>,
): Promise<FormState> {
    console.log(`Firebase desativado: updateClassroom para o ID ${id} retornando erro.`);
    return { success: false, message: 'Firebase está temporariamente desativado.' };
//   const validatedFields = classroomSchema.safeParse(values);
//   if (!validatedFields.success) {
//     return {
//       success: false,
//       message:
//         'Erro de validação. Por favor, verifique os campos do formulário.',
//       errors: validatedFields.error.flatten().fieldErrors,
//     };
//   }

//   try {
//     await classroomsCollection.doc(id).update({
//       ...validatedFields.data,
//       updatedAt: FieldValue.serverTimestamp(),
//     });

//     revalidatePath('/classrooms');
//     revalidatePath(`/classrooms/${id}/edit`);

//     return { success: true, message: 'Sala de aula atualizada com sucesso!' };
//   } catch (error) {
//     console.error(`Erro ao atualizar a sala de aula ${id}:`, error);
//     return {
//       success: false,
//       message: 'Ocorreu um erro inesperado no servidor ao atualizar.',
//     };
//   }
}

export async function deleteClassroom(
  id: string,
): Promise<{ success: boolean; message: string }> {
    console.log(`Firebase desativado: deleteClassroom para o ID ${id} retornando erro.`);
    return { success: false, message: 'Firebase está temporariamente desativado.' };
//   try {
//     const classGroupsQuery = await db
//       .collection('classgroups')
//       .where('assignedClassroomId', '==', id)
//       .limit(1)
//       .get();

//     if (!classGroupsQuery.empty) {
//       return {
//         success: false,
//         message:
//           'Não é possível excluir. A sala de aula está atualmente atribuída a uma ou mais turmas.',
//       };
//     }
//     await classroomsCollection.doc(id).delete();
//     revalidatePath('/classrooms');
//     return { success: true, message: 'Sala de aula excluída com sucesso.' };
//   } catch (error) {
//     console.error(`Erro ao deletar a sala de aula ${id}:`, error);
//     return {
//       success: false,
//       message: 'Ocorreu um erro inesperado no servidor ao excluir.',
//     };
//   }
}
