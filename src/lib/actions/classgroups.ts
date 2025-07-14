
'use server'

import { revalidatePath } from "next/cache";
import { readData, writeData } from "@/lib/data-utils";
import { ClassGroup } from "@/types";
import { v4 as uuidv4 } from 'uuid';
import { z } from "zod";
import { classGroupCreateSchema, classGroupEditSchema } from "@/lib/schemas/classgroups";


export async function getClassGroups(): Promise<ClassGroup[]> {
  try {
    const data = await readData('classgroups.json');
    if (!data) {
        return [];
    }
     const classGroups: ClassGroup[] = JSON.parse(data as unknown as string);

    return classGroups;
  } catch (error) {
    console.error("Failed to read or parse class groups data:", error);
    return [];
  }
}

export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
    const classGroups = await getClassGroups();
    return classGroups.find(cg => cg.id === id) || null;
}

export async function createClassGroup(values: z.infer<typeof classGroupCreateSchema>): Promise<{ success: boolean; message: string }> {
  try {
    const validatedValues = classGroupCreateSchema.parse(values);
    const classGroups = await getClassGroups();
    
    const newClassGroup: ClassGroup = {
      id: uuidv4(),
      ...validatedValues,
      year: new Date().getFullYear(),
    };

    classGroups.push(newClassGroup);
    await writeData('classgroups.json', classGroups);

    revalidatePath('/classgroups');
    return { success: true, message: "Turma adicionada com sucesso." };
  } catch (error) {
    console.error("Failed to add class group:", error);
    if (error instanceof z.ZodError) {
      return { success: false, message: `Erro de validação: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { success: false, message: "Falha ao adicionar a turma." };
  }
}

export async function updateClassGroup(id: string, values: z.infer<typeof classGroupEditSchema>): Promise<{ success: boolean; message: string }> {
    try {
        const validatedValues = classGroupEditSchema.parse(values);
        const classGroups = await getClassGroups();
        const classGroupIndex = classGroups.findIndex(cg => cg.id === id);

        if (classGroupIndex === -1) {
            return { success: false, message: "Turma não encontrada." };
        }

        const existingClassGroup = classGroups[classGroupIndex];
        classGroups[classGroupIndex] = {
            ...existingClassGroup,
            ...validatedValues,
        };

        await writeData('classgroups.json', classGroups);
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${id}/edit`);

        return { success: true, message: "Turma atualizada com sucesso." };
    } catch (error) {
        console.error("Failed to update class group:", error);
        if (error instanceof z.ZodError) {
          return { success: false, message: `Erro de validação: ${error.errors.map(e => e.message).join(', ')}` };
        }
        return { success: false, message: "Falha ao atualizar a turma." };
    }
}


export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const classGroups = await getClassGroups();
    const updatedClassGroups = classGroups.filter(cg => cg.id !== id);

    if (classGroups.length === updatedClassGroups.length) {
        return { success: false, message: "Turma não encontrada para exclusão." };
    }

    await writeData('classgroups.json', updatedClassGroups);
    revalidatePath('/classgroups');

    return { success: true, message: "Turma excluída com sucesso." };
  } catch (error) {
    console.error("Failed to delete class group:", error);
    return { success: false, message: "Falha ao excluir a turma." };
  }
}

export async function assignClassroomToClassGroup(classGroupId: string, classroomId: string | null): Promise<{ success: boolean, message: string }> {
    try {
        const classGroups = await getClassGroups();
        const classGroupIndex = classGroups.findIndex(cg => cg.id === classGroupId);

        if (classGroupIndex === -1) {
            return { success: false, message: "Turma não encontrada." };
        }

        classGroups[classGroupIndex].assignedClassroomId = classroomId ?? undefined;

        await writeData('classgroups.json', classGroups);
        revalidatePath('/classgroups');

        return { success: true, message: "Sala atribuída com sucesso." };

    } catch (error) {
        console.error("Failed to assign classroom to class group:", error);
        return { success: false, message: "Falha ao atribuir a sala." };
    }
}
