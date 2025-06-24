
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { Classroom, ClassGroup, EventReservation, ClassroomRecurringReservation } from '@/types';
import { classroomCreateSchema, classroomEditSchema, type ClassroomCreateValues, type ClassroomEditFormValues } from '@/lib/schemas/classrooms';

export async function getClassrooms(): Promise<Classroom[]> {
  try {
    return await readData<Classroom>('classrooms.json');
  } catch (error) {
    console.error('Failed to get classrooms:', error);
    return [];
  }
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
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/'); // Dashboard uses classroom count
    return { success: true, message: 'Sala de aula criada com sucesso!', data: newClassroom };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao criar sala.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create classroom:', error);
    return { success: false, message: 'Erro interno ao criar sala de aula.' };
  }
}

export async function updateClassroom(id: string, values: ClassroomEditFormValues) {
  try {
    const validatedValues = classroomEditSchema.parse(values);
    const classrooms = await readData<Classroom>('classrooms.json');
    const classroomIndex = classrooms.findIndex(c => c.id === id);

    if (classroomIndex === -1) {
      return { success: false, message: 'Sala não encontrada para atualização.' };
    }

    const existingClassroom = classrooms[classroomIndex];
    const updatedClassroom: Classroom = {
      ...existingClassroom,
      name: validatedValues.name,
      capacity: validatedValues.capacity,
      isUnderMaintenance: validatedValues.isUnderMaintenance ?? existingClassroom.isUnderMaintenance ?? false,
      maintenanceReason: validatedValues.isUnderMaintenance ? (validatedValues.maintenanceReason || '') : '',
      // resources and isLab are not part of edit form, preserve existing
    };

    classrooms[classroomIndex] = updatedClassroom;
    await writeData<Classroom>('classrooms.json', classrooms);

    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/'); // Dashboard
    return { success: true, message: 'Sala de aula atualizada com sucesso!', data: updatedClassroom };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao atualizar sala.', errors: error.flatten().fieldErrors };
    }
    console.error(`Failed to update classroom ${id}:`, error);
    return { success: false, message: 'Erro interno ao atualizar sala de aula.' };
  }
}

export async function deleteClassroom(id: string) {
  try {
    const classGroups = await readData<ClassGroup>('classgroups.json');
    if (classGroups.some(cg => cg.assignedClassroomId === id)) {
      return { success: false, message: 'Não é possível excluir a sala. Ela está atribuída a uma ou mais turmas.' };
    }

    const eventReservations = await readData<EventReservation>('event_reservations.json');
    if (eventReservations.some(er => er.classroomId === id)) {
        return { success: false, message: 'Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas de eventos.' };
    }

    const recurringReservations = await readData<ClassroomRecurringReservation>('recurring_reservations.json');
     if (recurringReservations.some(rr => rr.classroomId === id)) {
        return { success: false, message: 'Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas recorrentes.' };
    }
    
    let classrooms = await readData<Classroom>('classrooms.json');
    const classroomIndex = classrooms.findIndex(c => c.id === id);

    if (classroomIndex === -1) {
      return { success: false, message: 'Sala não encontrada para exclusão.' };
    }

    classrooms.splice(classroomIndex, 1);
    await writeData<Classroom>('classrooms.json', classrooms);

    revalidatePath('/classrooms');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/reservations');
    revalidatePath('/'); // Dashboard
    return { success: true, message: 'Sala de aula excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete classroom ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir sala de aula.' };
  }
}

export async function getClassroomById(id: string): Promise<Classroom | undefined> {
  try {
    const classrooms = await readData<Classroom>('classrooms.json');
    return classrooms.find(c => c.id === id);
  } catch (error) {
    console.error(`Failed to get classroom by ID ${id}:`, error);
    return undefined;
  }
}
