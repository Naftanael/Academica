'use server'

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from '@/lib/firebase/admin';
import type { ClassGroup } from "@/types";
import { classGroupCreateSchema, classGroupEditSchema } from "@/lib/schemas/classgroups";
import { Timestamp } from "firebase-admin/firestore";

const classGroupsCollection = db.collection('classgroups');

// Helper to convert Firestore doc to ClassGroup type
const docToClassGroup = (doc: FirebaseFirestore.DocumentSnapshot): ClassGroup => {
    const data = doc.data();
    if (!data) {
        throw new Error(`Document data not found for doc with id ${doc.id}`);
    }

    // Safely handle date conversions from Firestore Timestamp to ISO string
    const startDate = data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : new Date(data.startDate).toISOString();
    const endDate = data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : new Date(data.endDate).toISOString();

    return {
        id: doc.id,
        name: data.name,
        shift: data.shift,
        year: data.year,
        startDate: startDate,
        endDate: endDate,
        classDays: data.classDays ?? [], // Ensure classDays is always an array
        status: data.status ?? 'Planejada',
        assignedClassroomId: data.assignedClassroomId ?? undefined,
        notes: data.notes ?? undefined,
    };
};


export async function getClassGroups(): Promise<ClassGroup[]> {
  try {
    const snapshot = await classGroupsCollection.orderBy('name').get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(docToClassGroup);
  } catch (error) {
    console.error("Failed to get class groups from Firestore:", error);
    return [];
  }
}

export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
    try {
        const doc = await classGroupsCollection.doc(id).get();
        if (!doc.exists) {
            return null;
        }
        return docToClassGroup(doc);
    } catch (error) {
        console.error(`Failed to get class group ${id} from Firestore:`, error);
        return null;
    }
}

export async function createClassGroup(values: z.infer<typeof classGroupCreateSchema>): Promise<{ success: boolean; message: string; data?: ClassGroup }> {
  try {
    const validatedValues = classGroupCreateSchema.parse(values);
    
    const newClassGroupData = {
      ...validatedValues,
      year: new Date().getFullYear(),
      status: 'Planejada' as const, 
    };

    const docRef = await classGroupsCollection.add(newClassGroupData);
    const newClassGroup = await getClassGroupById(docRef.id);

    revalidatePath('/classgroups');
    return { success: true, message: "Turma adicionada com sucesso.", data: newClassGroup ?? undefined };
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
        const docRef = classGroupsCollection.doc(id);

        const doc = await docRef.get();
        if (!doc.exists) {
            return { success: false, message: "Turma não encontrada." };
        }

        await docRef.update(validatedValues);
        
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${id}/edit`);

        return { success: true, message: "Turma atualizada com sucesso." };
    } catch (error) {
        if (error instanceof z.ZodError) {
          return { success: false, message: `Erro de validação: ${error.errors.map(e => e.message).join(', ')}` };
        }
        console.error("Failed to update class group in Firestore:", error);
        return { success: false, message: "Falha ao atualizar a turma." };
    }
}


export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await classGroupsCollection.doc(id).delete();
    
    revalidatePath('/classgroups');

    return { success: true, message: "Turma excluída com sucesso." };
  } catch (error) {
    console.error("Failed to delete class group from Firestore:", error);
    return { success: false, message: "Falha ao excluir a turma." };
  }
}

export async function assignClassroomToClassGroup(classGroupId: string, classroomId: string | null): Promise<{ success: boolean, message: string }> {
    try {
        const docRef = classGroupsCollection.doc(classGroupId);
        
        const doc = await docRef.get();
        if (!doc.exists) {
            return { success: false, message: "Turma não encontrada." };
        }

        const updateData: { assignedClassroomId: string | null; status?: 'Planejada' } = {
            assignedClassroomId: classroomId ?? null,
        };

        if (classroomId) {
            updateData.status = 'Planejada';
        }

        await docRef.update(updateData);
        
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${classGroupId}/edit`);


        return { success: true, message: "Sala atribuída com sucesso." };
    } catch (error) {
        console.error("Failed to assign classroom to class group in Firestore:", error);
        return { success: false, message: "Falha ao atribuir a sala." };
    }
}
