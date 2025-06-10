
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { Course } from '@/types';

const courseFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da disciplina deve ter pelo menos 3 caracteres." }),
  workload: z.coerce.number({ invalid_type_error: "Carga horária deve ser um número." })
                     .min(1, { message: "A carga horária deve ser pelo menos 1." }),
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export async function getCourses(): Promise<Course[]> {
  return await readData<Course>('courses.json');
}

export async function createCourse(values: CourseFormValues) {
  try {
    const validatedValues = courseFormSchema.parse(values);
    const courses = await readData<Course>('courses.json');

    const newCourse: Course = {
      id: generateId(),
      name: validatedValues.name,
      workload: validatedValues.workload,
    };

    courses.push(newCourse);
    await writeData<Course>('courses.json', courses);

    revalidatePath('/courses');
    return { success: true, message: 'Disciplina criada com sucesso!', data: newCourse };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create course:', error);
    return { success: false, message: 'Erro ao criar disciplina. Verifique o console para mais detalhes.' };
  }
}

export async function deleteCourse(id: string) {
  try {
    let courses = await readData<Course>('courses.json');
    courses = courses.filter(c => c.id !== id);
    await writeData<Course>('courses.json', courses);
    revalidatePath('/courses');
    return { success: true, message: 'Disciplina excluída com sucesso!' };
  } catch (error) {
    console.error('Failed to delete course:', error);
    return { success: false, message: 'Erro ao excluir disciplina.' };
  }
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const courses = await readData<Course>('courses.json');
  return courses.find(c => c.id === id);
}
