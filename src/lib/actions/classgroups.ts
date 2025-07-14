
'use server'

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from '@/lib/firebase/admin';
import type { ClassGroup } from "@/types";
import { classGroupCreateSchema, classGroupEditSchema } from "@/lib/schemas/classgroups";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const classGroupsCollection = db.collection('classgroups');

// Helper to convert Firestore doc to ClassGroup type
const docToClassGroup = (doc: FirebaseFirestore.DocumentSnapshot): ClassGroup => {
    const data = doc.data();
    if (!data) {
        throw new Error(`Document data not found for doc with id ${doc.id}`);
    }

    const startDate = data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate;
    const endDate = data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate;

    return {
        id: doc.id,
        name: data.name,
        shift: data.shift,
        year: data.year,
        startDate: startDate,
        endDate: endDate,
        classDays: data.classDays ?? [],
        status: data.status ?? 'Planejada',
        assignedClassroomId: data.assignedClassroomId ?? undefined,
        notes: data.notes ?? undefined,
    };
};

export async function getClassGroups(): Promise<ClassGroup[]> {
  try {
    const snapshot = await classGroupsCollection.orderBy('name').get();
    return snapshot.docs.map(docToClassGroup);
  } catch (error) {
    console.error("Failed to get class groups from Firestore:", error);
    return [];
  }
}

export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
    try {
        const doc = await classGroupsCollection.doc(id).get();
        return doc.exists ? docToClassGroup(doc) : null;
    } catch (error) {
        console.error(`Failed to get class group ${id} from Firestore:`, error);
        return null;
    }
}

export async function createClassGroup(values: z.infer<typeof classGroupCreateSchema>): Promise<{ success: boolean; message: string; data?: ClassGroup }> {
  try {
    const validatedValues = classGroupCreateSchema.parse(values);
    
    // Check for duplicate name before starting the transaction
    const existingGroupQuery = classGroupsCollection.where('name', '==', validatedValues.name);
    const existingGroupSnapshot = await existingGroupQuery.get();

    if (!existingGroupSnapshot.empty) {
      return { success: false, message: 'Já existe uma turma com este nome.' };
    }

    const newClassGroupRef = classGroupsCollection.doc();
    const newClassGroupData = {
      ...validatedValues,
      startDate: new Date(validatedValues.startDate),
      endDate: new Date(validatedValues.endDate),
      year: new Date().getFullYear(),
      status: 'Planejada' as const,
      createdAt: FieldValue.serverTimestamp(),
    };
    
    await newClassGroupRef.set(newClassGroupData);

    const newClassGroup = {
      id: newClassGroupRef.id,
      ...validatedValues,
      year: newClassGroupData.year,
      status: newClassGroupData.status,
      createdAt: new Date().toISOString(), // optimistic timestamp for return
    };
    
    revalidatePath('/classgroups');
    return { success: true, message: "Turma adicionada com sucesso.", data: newClassGroup as unknown as ClassGroup };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: `Erro de validação: ${error.errors.map(e => e.message).join(', ')}` };
    }
    console.error("Failed to add class group to Firestore:", error);
    return { success: false, message: "Falha ao adicionar a turma." };
  }
}


export async function updateClassGroup(id: string, values: z.infer<typeof classGroupEditSchema>): Promise<{ success: boolean; message: string }> {
    try {
        const validatedValues = classGroupEditSchema.parse(values);
        
        await db.runTransaction(async (transaction) => {
            const docRef = classGroupsCollection.doc(id);
            const doc = await transaction.get(docRef);
            if (!doc.exists) {
                throw new Error("Turma não encontrada.");
            }
            // Convert date strings to Date objects for Firestore
            const updateData = {
                ...validatedValues,
                startDate: new Date(validatedValues.startDate),
                endDate: new Date(validatedValues.endDate),
            };
            transaction.update(docRef, updateData);
        });
        
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${id}/edit`);

        return { success: true, message: "Turma atualizada com sucesso." };
    } catch (error) {
        if (error instanceof z.ZodError) {
          return { success: false, message: `Erro de validação: ${error.errors.map(e => e.message).join(', ')}` };
        }
        console.error("Failed to update class group in Firestore:", error);
        return { success: false, message: (error as Error).message || "Falha ao atualizar a turma." };
    }
}

export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const classGroupDoc = await classGroupsCollection.doc(id).get();
    if (!classGroupDoc.exists) {
        return { success: false, message: "Turma não encontrada." };
    }

    const recurringReservationsQuery = db.collection('recurring_reservations').where('classGroupId', '==', id);
    const recurringReservationsSnapshot = await recurringReservationsQuery.get();

    if (!recurringReservationsSnapshot.empty) {
        return { success: false, message: "Não é possível excluir. A turma possui reservas recorrentes associadas." };
    }
      
    await classGroupsCollection.doc(id).delete();
    
    revalidatePath('/classgroups');
    revalidatePath('/'); // Revalidate dashboard as well
    revalidatePath('/room-availability');
    return { success: true, message: "Turma excluída com sucesso." };
  } catch (error) {
    console.error("Failed to delete class group from Firestore:", error);
    return { success: false, message: "Falha ao excluir a turma." };
  }
}

export async function assignClassroomToClassGroup(classGroupId: string, classroomId: string | null): Promise<{ success: boolean, message: string }> {
    try {
        await db.runTransaction(async (transaction) => {
            const docRef = classGroupsCollection.doc(classGroupId);
            const doc = await transaction.get(docRef);
            if (!doc.exists) {
                throw new Error("Turma não encontrada.");
            }

            const updateData: { assignedClassroomId: string | null } = {
                assignedClassroomId: classroomId ?? null,
            };
            
            transaction.update(docRef, updateData);
        });
        
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${classGroupId}/edit`);

        return { success: true, message: "Sala atribuída com sucesso." };
    } catch (error) {
        console.error("Failed to assign classroom to class group in Firestore:", error);
        return { success: false, message: (error as Error).message || "Falha ao atribuir a sala." };
    }
}
