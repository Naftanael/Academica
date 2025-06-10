
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { readData, writeData, generateId } from '@/lib/data-utils';
import type { AppCurso } from '@/types';

const appCursoFormSchema = z.object({
  name: z.string().min(3, { message: "O nome do curso deve ter pelo menos 3 caracteres." }),
});

export type AppCursoFormValues = z.infer<typeof appCursoFormSchema>;

export async function getAppCursos(): Promise<AppCurso[]> {
  return await readData<AppCurso>('app_cursos.json');
}

export async function createAppCurso(values: AppCursoFormValues) {
  try {
    const validatedValues = appCursoFormSchema.parse(values);
    const appCursos = await readData<AppCurso>('app_cursos.json');

    const newAppCurso: AppCurso = {
      id: generateId(),
      name: validatedValues.name,
    };

    appCursos.push(newAppCurso);
    await writeData<AppCurso>('app_cursos.json', appCursos);

    revalidatePath('/app-cursos');
    return { success: true, message: 'Curso criado com sucesso!', data: newAppCurso };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create AppCurso:', error);
    return { success: false, message: 'Erro ao criar curso. Verifique o console para mais detalhes.' };
  }
}

export async function deleteAppCurso(id: string) {
  try {
    let appCursos = await readData<AppCurso>('app_cursos.json');
    appCursos = appCursos.filter(c => c.id !== id);
    await writeData<AppCurso>('app_cursos.json', appCursos);
    revalidatePath('/app-cursos');
    return { success: true, message: 'Curso excluído com sucesso!' };
  } catch (error) {
    console.error('Failed to delete AppCurso:', error);
    return { success: false, message: 'Erro ao excluir curso.' };
  }
}

export async function getAppCursoById(id: string): Promise<AppCurso | undefined> {
  const appCursos = await readData<AppCurso>('app_cursos.json');
  return appCursos.find(c => c.id === id);
}
