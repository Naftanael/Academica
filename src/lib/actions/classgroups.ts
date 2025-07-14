
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { ClassGroup, ClassroomRecurringReservation, EventReservation } from '@/types';
import { classGroupCreateSchema, classGroupEditSchema, type ClassGroupCreateValues, type ClassGroupEditValues } from '@/lib/schemas/classgroups';
import { formatISO } from 'date-fns';

export async function getClassGroups(): Promise<ClassGroup[]> {
  try {
    const groups = await readData<ClassGroup>('classgroups.json');
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Failed to get class groups:', error);
    return [];
  }
}

export async function getClassGroupById(id: string): Promise<ClassGroup | undefined> {
  try {
    const classGroups = await readData<ClassGroup>('classgroups.json');
    return classGroups.find(cg => cg.id === id);
  } catch (error) {
    console.error(`Failed to get class group by ID ${id}:`, error);
    return undefined;
  }
}

export async function createClassGroup(values: ClassGroupCreateValues) {
  try {
    const validatedValues = classGroupCreateSchema.parse(values);
    const classGroups = await readData<ClassGroup>('classgroups.json');

    const newClassGroup: ClassGroup = {
      id: generateId(),
      name: validatedValues.name,
      shift: validatedValues.shift,
      classDays: validatedValues.classDays,
      year: validatedValues.year,
      status: validatedValues.status,
      startDate: formatISO(validatedValues.startDate, { representation: 'date' }),
      endDate: formatISO(validatedValues.endDate, { representation: 'date' }),
      notes: validatedValues.notes || '',
      assignedClassroomId: undefined,
    };

    classGroups.push(newClassGroup);
    await writeData('classgroups.json', classGroups);

    revalidatePath('/classgroups');
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, message: 'Turma criada com sucesso!', data: newClassGroup };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao criar turma.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create class group:', error);
    return { success: false, message: 'Erro interno ao criar turma.' };
  }
}

export async function updateClassGroup(id: string, values: ClassGroupEditValues) {
  try {
    const validatedValues = classGroupEditSchema.parse(values);
    const classGroups = await readData<ClassGroup>('classgroups.json');
    const classGroupIndex = classGroups.findIndex(cg => cg.id === id);

    if (classGroupIndex === -1) {
      return { success: false, message: 'Turma não encontrada para atualização.' };
    }

    const existingClassGroup = classGroups[classGroupIndex];
    classGroups[classGroupIndex] = {
      ...existingClassGroup,
      ...validatedValues,
    };

    await writeData('classgroups.json', classGroups);

    revalidatePath('/classgroups');
    revalidatePath(`/classgroups/${id}/edit`);
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/');
    return { success: true, message: 'Turma atualizada com sucesso!', data: classGroups[classGroupIndex] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao atualizar turma.', errors: error.flatten().fieldErrors };
    }
    console.error(`Failed to update class group ${id}:`, error);
    return { success: false, message: 'Erro interno ao atualizar turma.' };
  }
}

export async function deleteClassGroup(id: string) {
  try {
    const recurringReservations = await readData<ClassroomRecurringReservation>('recurring_reservations.json');
    if (recurringReservations.some(r => r.classGroupId === id)) {
        return { success: false, message: 'Não é possível excluir. A turma tem reservas recorrentes associadas.' };
    }

    // While event reservations are not directly tied to class groups, a future implementation might
    // so it is good practice to leave a check here if that relationship is added later.

    const classGroups = await readData<ClassGroup>('classgroups.json');
    const updatedClassGroups = classGroups.filter(cg => cg.id !== id);

    if (classGroups.length === updatedClassGroups.length) {
      return { success: false, message: 'Turma não encontrada para exclusão.' };
    }

    await writeData('classgroups.json', updatedClassGroups);

    revalidatePath('/classgroups');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/reservations');
    revalidatePath('/');
    return { success: true, message: 'Turma excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete class group ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir turma.' };
  }
}

export async function assignClassroomToClassGroup(classGroupId: string, newClassroomId: string | null) {
  try {
    const classGroups = await readData<ClassGroup>('classgroups.json');
    const classGroupIndex = classGroups.findIndex(cg => cg.id === classGroupId);

    if (classGroupIndex === -1) {
      return { success: false, message: 'Turma não encontrada para atribuição de sala.' };
    }

    classGroups[classGroupIndex].assignedClassroomId = newClassroomId === null ? undefined : newClassroomId;
    await writeData('classgroups.json', classGroups);

    revalidatePath('/classgroups');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/');
    return { success: true, message: 'Sala da turma atualizada com sucesso!', data: classGroups[classGroupIndex] };
  } catch (error) {
    console.error(`Failed to assign classroom to class group ${classGroupId}:`, error);
    return { success: false, message: 'Erro interno ao atribuir sala à turma.' };
  }
}
