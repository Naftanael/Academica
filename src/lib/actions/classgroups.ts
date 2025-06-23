
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { CLASS_GROUP_SHIFTS, CLASS_GROUP_STATUSES, DAYS_OF_WEEK } from '@/lib/constants';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { ClassGroup, ClassGroupStatus, DayOfWeek, PeriodOfDay } from '@/types';
import { formatISO, addMonths } from 'date-fns';

const classGroupFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(CLASS_GROUP_SHIFTS, {
    required_error: "Selecione um turno.",
    invalid_type_error: "Turno inválido.",
  }),
  classDays: z.array(z.enum(DAYS_OF_WEEK))
    .min(1, { message: "Selecione pelo menos um dia da semana." }),
  year: z.coerce.number({invalid_type_error: "Ano deve ser um número."}).optional(),
  status: z.enum(CLASS_GROUP_STATUSES as [string, ...string[]]).optional(),
  startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: "Data de início inválida."}),
  endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), { message: "Data de término inválida."}),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "A data de início não pode ser posterior à data de término.",
  path: ["endDate"],
});


const classGroupEditFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(CLASS_GROUP_SHIFTS, {
    required_error: "Selecione um turno.",
  }),
  classDays: z.array(z.enum(DAYS_OF_WEEK))
    .min(1, { message: "Selecione pelo menos um dia da semana." }),
});

export type ClassGroupFormValues = z.infer<typeof classGroupFormSchema>;
type ClassGroupEditFormValues = z.infer<typeof classGroupEditFormSchema>;

export async function getClassGroups(): Promise<ClassGroup[]> {
  try {
    return await readData<ClassGroup>('classgroups.json');
  } catch (error) {
    console.error('Failed to get class groups:', error);
    return [];
  }
}

export async function createClassGroup(values: ClassGroupFormValues) {
  try {
    const validatedValues = classGroupFormSchema.parse(values);
    const classGroups = await readData<ClassGroup>('classgroups.json');
    const now = new Date();

    const newClassGroup: ClassGroup = {
      id: generateId(),
      name: validatedValues.name,
      shift: validatedValues.shift,
      classDays: validatedValues.classDays,
      year: validatedValues.year || now.getFullYear(),
      status: (validatedValues.status || 'Planejada') as ClassGroupStatus,
      startDate: validatedValues.startDate || formatISO(now),
      endDate: validatedValues.endDate || formatISO(addMonths(now, 1)),
      assignedClassroomId: undefined,
    };

    classGroups.push(newClassGroup);
    await writeData<ClassGroup>('classgroups.json', classGroups);

    revalidatePath('/classgroups');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
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

export async function updateClassGroup(id: string, values: ClassGroupEditFormValues) {
  try {
    const validatedValues = classGroupEditFormSchema.parse(values);
    const classGroups = await readData<ClassGroup>('classgroups.json');
    const classGroupIndex = classGroups.findIndex(cg => cg.id === id);

    if (classGroupIndex === -1) {
      return { success: false, message: 'Turma não encontrada para atualização.' };
    }

    const existingClassGroup = classGroups[classGroupIndex];
    classGroups[classGroupIndex] = {
      ...existingClassGroup,
      name: validatedValues.name,
      shift: validatedValues.shift,
      classDays: validatedValues.classDays,
    };

    await writeData<ClassGroup>('classgroups.json', classGroups);

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
    let classGroups = await readData<ClassGroup>('classgroups.json');
    const classGroupIndex = classGroups.findIndex(cg => cg.id === id);

    if (classGroupIndex === -1) {
      return { success: false, message: 'Turma não encontrada para exclusão.' };
    }

    classGroups.splice(classGroupIndex, 1);
    await writeData<ClassGroup>('classgroups.json', classGroups);

    revalidatePath('/classgroups');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/');
    return { success: true, message: 'Turma excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete class group ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir turma.' };
  }
}

export async function getClassGroupById(id: string): Promise<ClassGroup | undefined> {
  try {
    const classGroups = await readData<ClassGroup>('classgroups.json');
    return classGroups.find(cg => cg.id === id);
  } catch (error)
    {
    console.error(`Failed to get class group by ID ${id}:`, error);
    return undefined;
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
    await writeData<ClassGroup>('classgroups.json', classGroups);

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
