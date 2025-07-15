// src/lib/actions/classgroups.ts
'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";
// import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { db } from '@/lib/firebase/firebaseAdmin';
import { classGroupCreateSchema, classGroupEditSchema } from "@/lib/schemas/classgroups";
import type { ClassGroup } from "@/types";

// const classGroupsCollection = db.collection('classgroups');

const docToClassGroup = (doc: any): ClassGroup => {
    const data = doc.data();
    if (!data) throw new Error(`Document data not found for doc with id ${doc.id}`);

    const startDate = new Date().toISOString();
    const endDate = new Date().toISOString();

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

export async function getClassGroups(): Promise<ClassGroup[]> {
  console.log("Firebase desativado: getClassGroups retornando array vazio.");
  return [];
}

export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
    console.log(`Firebase desativado: getClassGroupById para o ID ${id} retornando null.`);
    return null;
}

export async function createClassGroup(prevState: any, values: z.infer<typeof classGroupCreateSchema>) {
  console.log("Firebase desativado: createClassGroup retornando erro.");
  const validatedFields = classGroupCreateSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Erro de validação (Firebase desativado).',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  return { success: false, message: "Firebase está temporariamente desativado." };
}

export async function updateClassGroup(id: string, prevState: any, values: z.infer<typeof classGroupEditSchema>) {
    console.log(`Firebase desativado: updateClassGroup para o ID ${id} retornando erro.`);
    const validatedFields = classGroupEditSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        success: false,
        message: 'Erro de validação (Firebase desativado).',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }
    return { success: false, message: "Firebase está temporariamente desativado." };
}

export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
  console.log(`Firebase desativado: deleteClassGroup para o ID ${id} retornando erro.`);
  return { success: false, message: "Firebase está temporariamente desativado." };
}

export async function assignClassroomToClassGroup(classGroupId: string, classroomId: string | null): Promise<{ success: boolean, message: string }> {
    console.log(`Firebase desativado: assignClassroomToClassGroup para o ID ${classGroupId} retornando erro.`);
    return { success: false, message: "Firebase está temporariamente desativado." };
}
