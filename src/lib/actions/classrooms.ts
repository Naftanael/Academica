'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { Classroom } from '@/types';

const classroomFormSchema = z.object({
  name: z.string().min(1, { message: "O nome da sala é obrigatório." })
                 .min(3, { message: "O nome da sala deve ter pelo menos 3 caracteres." }),
  capacity: z.coerce.number({invalid_type_error: "Capacidade deve ser um número."})
                     .min(1, { message: "A capacidade deve ser pelo menos 1." }),
  resources: z.array(z.string()).optional(),
  isLab: z.boolean().optional(),
});

export type ClassroomFormValues = z.infer<typeof classroomFormSchema>;

export async function getClassrooms(): Promise<Classroom[]> {
  return await readData<Classroom>('classrooms.json');
}

export async function createClassroom(values: ClassroomFormValues) {
  try {
    const validatedValues = classroomFormSchema.parse(values);
    const classrooms = await readData<Classroom>('classrooms.json');

    const newClassroom: Classroom = {
      id: generateId(),
      name: validatedValues.name,
      capacity: validatedValues.capacity,
      resources: validatedValues.resources || [],
      isLab: validatedValues.isLab || false,
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

export async function updateClassroom(id: string, values: Partial<ClassroomFormValues>) {
  try {
    // For updates, we might only get partial data, so parse against a partial schema if needed
    // or ensure the form sends all relevant data. Here, we'll validate the parts we expect to change.
    const updateSchema = classroomFormSchema.pick({ name: true, capacity: true }).partial(); // Allow partial updates for other fields if they were included
    const validatedValues = updateSchema.parse(values);

    const classrooms = await readData<Classroom>('classrooms.json');
    const classroomIndex = classrooms.findIndex(c => c.id === id);

    if (classroomIndex === -1) {
      return { success: false, message: 'Sala não encontrada.' };
    }

    const existingClassroom = classrooms[classroomIndex];
    
    // Merge updates: only update fields that are present in validatedValues
    const updatedClassroom: Classroom = {
      ...existingClassroom,
      ...(validatedValues.name && { name: validatedValues.name }),
      ...(validatedValues.capacity !== undefined && { capacity: validatedValues.capacity }),
      // resources and isLab are not part of this form's submission, so they are preserved
    };

    classrooms[classroomIndex] = updatedClassroom;
    await writeData<Classroom>('classrooms.json', classrooms);

    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);
    revalidatePath('/room-availability');
    revalidatePath('/tv-display'); // In case room name changes affect TV display
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
    // Also ensure this classroom is not assigned to any class group
    // For simplicity, this check is omitted here but would be important in a real app.
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
