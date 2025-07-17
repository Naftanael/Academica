
/**
 * @file Manages all server-side actions for class groups using Firestore.
 */
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firestore';
import { classGroupCreateSchema, classGroupEditSchema } from '@/lib/schemas/classgroups';
import type { ClassGroup } from '@/types';

type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Creates a new class group document in Firestore.
 */
export async function createClassGroup(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = classGroupCreateSchema.safeParse({
    name: formData.get('name'),
    subject: formData.get('subject'),
    shift: formData.get('shift'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    classDays: formData.getAll('classDays'),
    notes: formData.get('notes'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'A validação falhou.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await db.collection('classgroups').add({
      ...validatedFields.data,
      status: 'Planejada', // Default status for new class groups
    });

    revalidatePath('/classgroups');
    return { success: true, message: 'Turma criada com sucesso!' };
  } catch (error) {
    console.error('Erro ao criar a turma:', error);
    return { success: false, message: 'Erro do Servidor: Falha ao criar a turma.' };
  }
}

/**
 * Fetches all class groups from Firestore and enriches them with classroom names.
 */
export async function getClassGroups(): Promise<(ClassGroup & { classroomName?: string })[]> {
  try {
    const classGroupsSnapshot = await db.collection('classgroups').get();
    if (classGroupsSnapshot.empty) {
      return [];
    }

    const classGroupsPromises = classGroupsSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const classGroup: ClassGroup = {
        id: doc.id,
        name: data.name,
        subject: data.subject,
        shift: data.shift,
        startDate: data.startDate?.toDate().toISOString() || '',
        endDate: data.endDate?.toDate().toISOString() || '',
        assignedClassroomId: data.assignedClassroomId,
        classDays: data.classDays,
        notes: data.notes,
        status: data.status || 'Planejada', // Add status, default if missing
      };
      
      let classroomName = 'Não atribuída';
      if (classGroup.assignedClassroomId) {
        const classroomDoc = await db.collection('classrooms').doc(classGroup.assignedClassroomId).get();
        if (classroomDoc.exists) {
          classroomName = classroomDoc.data()?.name || 'Desconhecida';
        }
      }
      
      return { ...classGroup, classroomName };
    });

    return Promise.all(classGroupsPromises);
  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    return [];
  }
}

/**
 * Fetches a single class group by its ID from Firestore.
 */
export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
    if (!id) return null;
    try {
        const docSnap = await db.collection('classgroups').doc(id).get();
        if (!docSnap.exists) {
            return null;
        }
        const data = docSnap.data();
        if (!data) return null;

        return { 
          id: docSnap.id, 
          name: data.name,
          subject: data.subject,
          shift: data.shift,
          startDate: data.startDate?.toDate().toISOString() || '',
          endDate: data.endDate?.toDate().toISOString() || '',
          assignedClassroomId: data.assignedClassroomId,
          classDays: data.classDays,
          notes: data.notes,
          status: data.status || 'Planejada',
        } as ClassGroup;
    } catch (error) {
        console.error(`Erro ao buscar turma com ID ${id}:`, error);
        return null;
    }
}

/**
 * Updates a class group document in Firestore.
 */
export async function updateClassGroup(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = classGroupEditSchema.safeParse({
        name: formData.get('name'),
        subject: formData.get('subject'),
        shift: formData.get('shift'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        classDays: formData.getAll('classDays'),
        notes: formData.get('notes'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'A validação falhou.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await db.collection('classgroups').doc(id).update(validatedFields.data);
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${id}/edit`);
        return { success: true, message: 'Turma atualizada com sucesso.' };
    } catch (error) {
        console.error(`Erro ao atualizar turma com ID ${id}:`, error);
        return { success: false, message: 'Erro do Servidor: Falha ao atualizar a turma.' };
    }
}


/**
 * Deletes a class group document from Firestore.
 */
export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'O ID da turma é obrigatório.' };
  }
  try {
    await db.collection('classgroups').doc(id).delete();
    revalidatePath('/classgroups');
    return { success: true, message: 'Turma deletada com sucesso.' };
  } catch (error) {
    console.error(`Erro ao deletar turma com ID ${id}:`, error);
    return { success: false, message: 'Erro do Servidor: Falha ao deletar a turma.' };
  }
}

/**
 * Changes the classroom for a specific class group.
 */
export async function changeClassroom(classGroupId: string, newClassroomId: string): Promise<{ success: boolean; message: string }> {
    if (!classGroupId || !newClassroomId) {
        return { success: false, message: "O ID da turma e o ID da nova sala são obrigatórios." };
    }
    try {
        await db.collection('classgroups').doc(classGroupId).update({ assignedClassroomId: newClassroomId });
        revalidatePath('/classgroups');
        return { success: true, message: "Sala de aula alterada com sucesso." };
    } catch (error) {
        console.error(`Erro ao alterar a sala da turma ${classGroupId}:`, error);
        return { success: false, message: "Erro do Servidor: Falha ao alterar a sala." };
    }
}

export async function unassignClassroomFromClassGroup(classGroupId: string): Promise<{ success: boolean; message: string }> {
  if (!classGroupId) {
    return { success: false, message: "O ID da turma é obrigatório." };
  }
  try {
    await db.collection('classgroups').doc(classGroupId).update({ assignedClassroomId: null });
    revalidatePath('/classgroups');
    return { success: true, message: "Sala de aula desatribuída com sucesso." };
  } catch (error) {
    console.error(`Erro ao desatribuir a sala da turma ${classGroupId}:`, error);
    return { success: false, message: "Erro do Servidor: Falha ao desatribuir a sala." };
  }
}
