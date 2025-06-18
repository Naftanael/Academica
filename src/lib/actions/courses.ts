
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { Course } from '@/types';

// Schema for course creation and update - assuming same fields for now
const courseFormSchema = z.object({
  name: z.string().min(3, { message: "O nome da disciplina deve ter pelo menos 3 caracteres." }).max(100, {message: "Nome da disciplina muito longo."}),
  workload: z.coerce.number({ invalid_type_error: "Carga horária deve ser um número." })
                     .min(1, { message: "A carga horária deve ser pelo menos 1." })
                     .max(500, {message: "Carga horária muito alta."}), // Example max
});

export type CourseFormValues = z.infer<typeof courseFormSchema>;

export async function getCourses(): Promise<Course[]> {
  try {
    return await readData<Course>('courses.json');
  } catch (error) {
    console.error('Failed to get courses:', error);
    return [];
  }
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

    revalidatePath('/courses'); // Assuming a page exists at /courses
    // Add other revalidations if courses affect other pages (e.g., class group details if disciplines are linked)
    return { success: true, message: 'Disciplina criada com sucesso!', data: newCourse };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao criar disciplina.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create course:', error);
    return { success: false, message: 'Erro interno ao criar disciplina.' };
  }
}

// updateCourse - if needed later, would follow a similar pattern to updateClassroom
// export async function updateCourse(id: string, values: CourseFormValues) { ... }

export async function deleteCourse(id: string) {
  try {
    let courses = await readData<Course>('courses.json');
    const courseIndex = courses.findIndex(c => c.id === id);

    if (courseIndex === -1) {
      return { success: false, message: 'Disciplina não encontrada para exclusão.' };
    }
    
    // Future: Check if course is linked to any class groups before deleting
    // For now, direct deletion.

    courses.splice(courseIndex, 1);
    await writeData<Course>('courses.json', courses);

    revalidatePath('/courses');
    return { success: true, message: 'Disciplina excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete course ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir disciplina.' };
  }
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  try {
    const courses = await readData<Course>('courses.json');
    return courses.find(c => c.id === id);
  } catch (error) {
    console.error(`Failed to get course by ID ${id}:`, error);
    return undefined;
  }
}
