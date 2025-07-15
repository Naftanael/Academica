// src/lib/actions/classgroups.ts
'use server'

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from '@/lib/firebase/admin';
import type { ClassGroup } from "@/types";
import { classGroupCreateSchema, classGroupEditSchema } from "@/lib/schemas/classgroups";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const classGroupsCollection = db ? db.collection('classgroups') : null;

// Helper to convert Firestore doc to ClassGroup type
const docToClassGroup = (doc: FirebaseFirestore.DocumentSnapshot): ClassGroup => {
    const data = doc.data();
    if (!data) throw new Error(`Document data not found for doc with id ${doc.id}`);

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
        assignedClassroomId: data.assignedClassroomId ?? undefined,
        notes: data.notes ?? undefined,
    };
};

export async function getClassGroups(): Promise<ClassGroup[]> {
    if (!classGroupsCollection) {
        console.error("Firestore is not initialized.");
        return [];
    }
  try {
    const snapshot = await classGroupsCollection.orderBy('name').get();
    return snapshot.docs.map(docToClassGroup);
  } catch (error) {
    console.error("Failed to get class groups from Firestore:", error);
    return [];
  }
}

export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
    if (!classGroupsCollection) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const doc = await classGroupsCollection.doc(id).get();
        return doc.exists ? docToClassGroup(doc) : null;
    } catch (error) {
        console.error(`Failed to get class group ${id} from Firestore:`, error);
        return null;
    }
}

// Refactored to work with useFormState
export async function createClassGroup(prevState: any, values: z.infer<typeof classGroupCreateSchema>) {
    if (!classGroupsCollection) {
        return { success: false, message: 'Erro: O banco de dados não foi inicializado.' };
    }
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

    const newClassGroupRef = classGroupsCollection.doc();
    const newClassGroupData = {
      ...validatedFields.data,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      year: new Date().getFullYear(),
      status: 'Planejada' as const,
      createdAt: FieldValue.serverTimestamp(),
    };
    await newClassGroupRef.set(newClassGroupData);
    
    const newClassGroup = await getClassGroupById(newClassGroupRef.id);

    revalidatePath('/classgroups');
    return { success: true, message: "Turma criada com sucesso.", data: newClassGroup };
  } catch (error) {
    console.error("Failed to create class group:", error);
    return { success: false, message: "Falha ao criar a turma." };
  }
}

// Refactored to work with useFormState
export async function updateClassGroup(id: string, prevState: any, values: z.infer<typeof classGroupEditSchema>) {
    if (!classGroupsCollection) {
        return { success: false, message: 'Erro: O banco de dados não foi inicializado.' };
    }
    const validatedFields = classGroupEditSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Erro de validação. Verifique os campos.',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    try {
        const docRef = classGroupsCollection.doc(id);
        await docRef.update({
          ...validatedFields.data,
          startDate: new Date(validatedFields.data.startDate),
          endDate: new Date(validatedFields.data.endDate),
        });
        
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${id}/edit`);

        return { success: true, message: "Turma atualizada com sucesso." };
    } catch (error) {
        console.error("Failed to update class group:", error);
        return { success: false, message: "Falha ao atualizar a turma." };
    }
}

export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
    if (!classGroupsCollection || !db) {
        console.error("Firestore is not initialized.");
        return { success: false, message: 'Erro: O banco de dados não foi inicializado.' };
    }
  try {
    const classGroupDoc = await classGroupsCollection.doc(id).get();
    if (!classGroupDoc.exists) {
        return { success: false, message: "Turma não encontrada." };
    }

    const recurringReservationsQuery = db.collection('recurring_reservations').where('classGroupId', '==', id).limit(1).get();
    const recurringReservationsSnapshot = await recurringReservationsQuery;
    if (!recurringReservationsSnapshot.empty) {
        return { success: false, message: "Não é possível excluir. A turma possui reservas recorrentes associadas." };
    }
      
    await classGroupsCollection.doc(id).delete();
    
    revalidatePath('/classgroups');
    revalidatePath('/');
    revalidatePath('/room-availability');
    return { success: true, message: "Turma excluída com sucesso." };
  } catch (error) {
    console.error("Failed to delete class group:", error);
    return { success: false, message: "Falha ao excluir a turma." };
  }
}

export async function assignClassroomToClassGroup(classGroupId: string, classroomId: string | null): Promise<{ success: boolean, message: string }> {
    if (!classGroupsCollection) {
        console.error("Firestore is not initialized.");
        return { success: false, message: 'Erro: O banco de dados não foi inicializado.' };
    }
    try {
        const docRef = classGroupsCollection.doc(classGroupId);
        await docRef.update({
            assignedClassroomId: classroomId,
            updatedAt: FieldValue.serverTimestamp()
        });
        
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${classGroupId}/edit`);
        revalidatePath('/room-availability');


        return { success: true, message: "Sala atribuída com sucesso." };
    } catch (error) {
        console.error("Failed to assign classroom:", error);
        return { success: false, message: "Falha ao atribuir a sala." };
    }
}
