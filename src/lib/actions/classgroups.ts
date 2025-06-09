
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CLASS_GROUP_SHIFTS, CLASS_GROUP_STATUSES, DAYS_OF_WEEK } from '@/lib/constants';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { ClassGroup, ClassGroupShift, ClassGroupStatus, DayOfWeek } from '@/types';
import { formatISO, addMonths } from 'date-fns';

const classGroupFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(CLASS_GROUP_SHIFTS as [string, ...string[]], { message: "Turno inválido." }),
  classDays: z.array(z.enum(DAYS_OF_WEEK as [string, ...string[]]))
    .min(1, { message: "Selecione pelo menos um dia da semana." }),
  // Fields not in the form but part of ClassGroup, will be defaulted
  year: z.number().optional(),
  status: z.enum(CLASS_GROUP_STATUSES as [string, ...string[]]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  disciplines: z.array(z.object({
    courseId: z.string(),
    completed: z.boolean(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).optional(),
});

export type ClassGroupFormValues = z.infer<typeof classGroupFormSchema>;

export async function getClassGroups(): Promise<ClassGroup[]> {
  return await readData<ClassGroup>('classgroups.json');
}

export async function createClassGroup(values: ClassGroupFormValues) {
  try {
    const validatedValues = classGroupFormSchema.parse(values);
    const classGroups = await readData<ClassGroup>('classgroups.json');

    const now = new Date();

    const newClassGroup: ClassGroup = {
      id: generateId(),
      name: validatedValues.name,
      shift: validatedValues.shift as ClassGroupShift,
      classDays: validatedValues.classDays as DayOfWeek[],
      year: validatedValues.year || now.getFullYear(),
      status: (validatedValues.status || 'Planejada') as ClassGroupStatus,
      startDate: validatedValues.startDate || formatISO(now),
      endDate: validatedValues.endDate || formatISO(addMonths(now, 1)),
      disciplines: validatedValues.disciplines || [],
      assignedClassroomId: undefined,
    };

    classGroups.push(newClassGroup);
    await writeData<ClassGroup>('classgroups.json', classGroups);

    revalidatePath('/classgroups');
    return { success: true, message: 'Turma criada com sucesso!', data: newClassGroup };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create class group:', error);
    return { success: false, message: 'Erro ao criar turma. Verifique o console para mais detalhes.' };
  }
}

export async function deleteClassGroup(id: string) {
  try {
    let classGroups = await readData<ClassGroup>('classgroups.json');
    classGroups = classGroups.filter(cg => cg.id !== id);
    await writeData<ClassGroup>('classgroups.json', classGroups);
    revalidatePath('/classgroups');
    return { success: true, message: 'Turma excluída com sucesso!' };
  } catch (error) {
    console.error('Failed to delete class group:', error);
    return { success: false, message: 'Erro ao excluir turma.' };
  }
}

export async function getClassGroupById(id: string): Promise<ClassGroup | undefined> {
  const classGroups = await readData<ClassGroup>('classgroups.json');
  return classGroups.find(cg => cg.id === id);
}
