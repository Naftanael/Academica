// src/lib/actions/classgroups.ts
'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { db } from '@/lib/firebase/firebaseAdmin';
import { classGroupCreateSchema, classGroupEditSchema } from "@/lib/schemas/classgroups";
import type { ClassGroup } from "@/types";

const classGroupsCollection = db.collection('classgroups');

// Helper para converter um documento do Firestore para o nosso tipo ClassGroup.
const docToClassGroup = (doc: FirebaseFirestore.DocumentSnapshot): ClassGroup => {
    const data = doc.data();
    if (!data) throw new Error(`Document data not found for doc with id ${doc.id}`);

    // Garante que as datas sejam convertidas para string ISO, seja de um Timestamp ou de uma string já existente.
    const startDate = data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate;
    const endDate = data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate;

    return {
        id: doc.id,
        name: data.name,
        shift: data.shift,
        year: data.year,
        startDate,
        endDate,
        classDays: data.classDays ?? [],
        status: data.status ?? 'Planejada',
        assignedClassroomId: data.assignedClassroomId,
        notes: data.notes,
    };
};

/**
 * Busca todas as turmas do Firestore, ordenadas por nome.
 * Lança um erro em caso de falha.
 */
export async function getClassGroups(): Promise<ClassGroup[]> {
  try {
    const snapshot = await classGroupsCollection.orderBy('name').get();
    return snapshot.docs.map(docToClassGroup);
  } catch (error) {
    console.error("Error fetching class groups from Firestore:", error);
    throw new Error("Failed to retrieve class groups.");
  }
}

/**
 * Busca uma turma específica pelo seu ID.
 * Retorna null se não encontrada. Lança um erro em caso de falha.
 */
export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
    try {
        const doc = await classGroupsCollection.doc(id).get();
        return doc.exists ? docToClassGroup(doc) : null;
    } catch (error) {
        console.error(`Error fetching class group ${id} from Firestore:`, error);
        throw new Error(`Failed to retrieve class group ${id}.`);
    }
}

/**
 * Cria uma nova turma no Firestore.
 */
export async function createClassGroup(prevState: any, values: z.infer<typeof classGroupCreateSchema>) {
  const validatedFields = classGroupCreateSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação. Verifique os campos.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const { name, startDate, endDate } = validatedFields.data;

    const existingGroupQuery = await classGroupsCollection.where('name', '==', name).limit(1).get();
    if (!existingGroupQuery.empty) {
      return { success: false, message: 'Já existe uma turma com este nome.' };
    }

    const newDocRef = await classGroupsCollection.add({
      ...validatedFields.data,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      year: new Date(startDate).getFullYear(),
      status: 'Planejada' as const,
      createdAt: FieldValue.serverTimestamp(),
    });
    
    const newDoc = await newDocRef.get();
    const newClassGroup = docToClassGroup(newDoc);

    revalidatePath('/classgroups');
    return { success: true, message: "Turma criada com sucesso.", data: newClassGroup };
  } catch (error) {
    console.error("Failed to create class group:", error);
    return { success: false, message: "Ocorreu um erro no servidor ao criar a turma." };
  }
}

/**
 * Atualiza uma turma existente no Firestore.
 */
export async function updateClassGroup(id: string, prevState: any, values: z.infer<typeof classGroupEditSchema>) {
    const validatedFields = classGroupEditSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Erro de validação. Verifique os campos.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    try {
        await classGroupsCollection.doc(id).update({
          ...validatedFields.data,
          startDate: new Date(validatedFields.data.startDate),
          endDate: new Date(validatedFields.data.endDate),
          updatedAt: FieldValue.serverTimestamp(),
        });
        
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${id}/edit`);

        return { success: true, message: "Turma atualizada com sucesso." };
    } catch (error) {
        console.error("Failed to update class group:", error);
        return { success: false, message: "Ocorreu um erro no servidor ao atualizar a turma." };
    }
}

/**
 * Deleta uma turma, verificando antes se existem reservas associadas.
 */
export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
  try {
    // Verifica se a turma possui reservas recorrentes associadas.
    const reservationsQuery = db.collection('recurring_reservations').where('classGroupId', '==', id).limit(1).get();
    const reservationsSnapshot = await reservationsQuery;
    if (!reservationsSnapshot.empty) {
        return { success: false, message: "Não é possível excluir. A turma possui reservas recorrentes associadas." };
    }
      
    await classGroupsCollection.doc(id).delete();
    
    revalidatePath('/classgroups');
    revalidatePath('/');
    revalidatePath('/room-availability');
    return { success: true, message: "Turma excluída com sucesso." };
  } catch (error) {
    console.error("Failed to delete class group:", error);
    return { success: false, message: "Ocorreu um erro no servidor ao excluir a turma." };
  }
}

/**
 * Atribui uma sala de aula a uma turma.
 */
export async function assignClassroomToClassGroup(classGroupId: string, classroomId: string | null): Promise<{ success: boolean, message: string }> {
    try {
        await classGroupsCollection.doc(classGroupId).update({
            assignedClassroomId: classroomId, // Firestore lida bem com `null` para remover o campo.
            updatedAt: FieldValue.serverTimestamp()
        });
        
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${classGroupId}/edit`);
        revalidatePath('/room-availability');

        return { success: true, message: "Sala atribuída com sucesso." };
    } catch (error) {
        console.error("Failed to assign classroom:", error);
        return { success: false, message: "Ocorreu um erro no servidor ao atribuir a sala." };
    }
}
