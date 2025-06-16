
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { Classroom, ClassGroup } from '@/types'; // Import ClassGroup
import { classroomCreateSchema, classroomEditSchema, type ClassroomCreateValues, type ClassroomEditFormValues } from '@/lib/schemas/classrooms';

export async function getClassrooms(): Promise<Classroom[]> {
  return await readData<Classroom>('classrooms.json');
}

export async function createClassroom(values: ClassroomCreateValues) {
  try {
    const validatedValues = classroomCreateSchema.parse(values);
    const classrooms = await readData<Classroom>('classrooms.json');

    const newClassroom: Classroom = {
      id: generateId(),
      name: validatedValues.name,
      capacity: validatedValues.capacity,
      resources: validatedValues.resources || [],
      isLab: validatedValues.isLab || false,
      isUnderMaintenance: validatedValues.isUnderMaintenance ?? false,
      maintenanceReason: validatedValues.isUnderMaintenance ? (validatedValues.maintenanceReason || '') : '',
    };

    classrooms.push(newClassroom);
    await writeData<Classroom>('classrooms.json', classrooms);

    revalidatePath('/classrooms');
    return { success: true, message: 'Sala de aula criada com sucesso!', data: newClassroom };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create classroom:', error);
    return { success: false, message: 'Erro ao criar sala de aula. Verifique o console para mais detalhes.' };
  }
}

export async function updateClassroom(id: string, values: ClassroomEditFormValues) {
  try {
    const validatedValues = classroomEditSchema.parse(values);

    const classrooms = await readData<Classroom>('classrooms.json');
    const classroomIndex = classrooms.findIndex(c => c.id === id);

    if (classroomIndex === -1) {
      return { success: false, message: 'Sala não encontrada.' };
    }

    const existingClassroom = classrooms[classroomIndex];
    
    const updatedClassroom: Classroom = {
      ...existingClassroom,
      name: validatedValues.name,
      capacity: validatedValues.capacity,
      isUnderMaintenance: validatedValues.isUnderMaintenance ?? existingClassroom.isUnderMaintenance ?? false,
      maintenanceReason: validatedValues.isUnderMaintenance ? (validatedValues.maintenanceReason || '') : '',
    };

    classrooms[classroomIndex] = updatedClassroom;
    await writeData<Classroom>('classrooms.json', classrooms);

    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    return { success: true, message: 'Sala de aula atualizada com sucesso!', data: updatedClassroom };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to update classroom:', error);
    return { success: false, message: 'Erro ao atualizar sala de aula.' };
  }
}


export async function deleteClassroom(id: string) {
  try {
    let classrooms = await readData<Classroom>('classrooms.json');
    // Additionally, ensure no class groups are assigned to this classroom
    let classGroups = await readData<ClassGroup>('classgroups.json');
    const isAssigned = classGroups.some(cg => cg.assignedClassroomId === id);
    if (isAssigned) {
      return { success: false, message: 'Não é possível excluir a sala. Ela está atribuída a uma ou mais turmas.' };
    }
    
    classrooms = classrooms.filter(c => c.id !== id);
    await writeData<Classroom>('classrooms.json', classrooms);
    revalidatePath('/classrooms');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    return { success: true, message: 'Sala de aula excluída com sucesso!' };
  } catch (error) {
    console.error('Failed to delete classroom:', error);
    return { success: false, message: 'Erro ao excluir sala de aula.' };
  }
}

export async function getClassroomById(id: string): Promise<Classroom | undefined> {
  const classrooms = await readData<Classroom>('classrooms.json');
  return classrooms.find(c => c.id === id);
}
