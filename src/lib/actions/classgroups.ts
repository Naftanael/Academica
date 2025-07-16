// src/lib/actions/classgroups.ts
'use server';

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from '@/lib/database';
import { classGroupCreateSchema, classGroupEditSchema } from "@/lib/schemas/classgroups";
import type { ClassGroup } from "@/types";
import { v4 as uuidv4 } from "uuid";

export async function getClassGroups(): Promise<ClassGroup[]> {
  try {
    const db = await getDb();
    const classGroups = await db.all('SELECT * FROM class_groups');
    return classGroups.map(cg => ({ ...cg, days_of_week: JSON.parse(cg.days_of_week) }));
  } catch (error) {
    console.error('Failed to fetch class groups:', error);
    return [];
  }
}

export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
  try {
    const db = await getDb();
    const classGroup = await db.get('SELECT * FROM class_groups WHERE id = ?', id);
    if (classGroup) {
      return { ...classGroup, days_of_week: JSON.parse(classGroup.days_of_week) };
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch class group with ID ${id}:`, error);
    return null;
  }
}

export async function createClassGroup(prevState: any, values: z.infer<typeof classGroupCreateSchema>) {
  const validatedFields = classGroupCreateSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation error.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const db = await getDb();
    const newClassGroupId = uuidv4();
    await db.run(
      'INSERT INTO class_groups (id, name, course, start_date, end_date, start_time, end_time, days_of_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      newClassGroupId,
      validatedFields.data.name,
      validatedFields.data.course,
      validatedFields.data.startDate,
      validatedFields.data.endDate,
      '00:00', // Mock start time
      '00:00', // Mock end time
      JSON.stringify(validatedFields.data.classDays)
    );
    revalidatePath('/classgroups');
    return { success: true, message: 'Class group created successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}

export async function updateClassGroup(id: string, prevState: any, values: z.infer<typeof classGroupEditSchema>) {
  const validatedFields = classGroupEditSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation error.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const db = await getDb();
    await db.run(
      'UPDATE class_groups SET name = ?, course = ?, start_date = ?, end_date = ?, start_time = ?, end_time = ?, days_of_week = ? WHERE id = ?',
      validatedFields.data.name,
      validatedFields.data.course,
      validatedFields.data.startDate,
      validatedFields.data.endDate,
      '00:00', // Mock start time
      '00:00', // Mock end time
      JSON.stringify(validatedFields.data.classDays),
      id
    );
    revalidatePath('/classgroups');
    revalidatePath(`/classgroups/${id}/edit`);
    return { success: true, message: 'Class group updated successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}

export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    await db.run('DELETE FROM class_groups WHERE id = ?', id);
    revalidatePath('/classgroups');
    return { success: true, message: 'Class group deleted successfully.' };
  } catch (error: any) {
    return { success: false, message: `Server error: ${error.message}` };
  }
}

export async function assignClassroomToClassGroup(classGroupId: string, classroomId: string | null): Promise<{ success: boolean, message: string }> {
    try {
        const db = await getDb();
        await db.run('UPDATE class_groups SET classroom_id = ? WHERE id = ?', classroomId, classGroupId);
        revalidatePath('/classgroups');
        return { success: true, message: 'Classroom assigned successfully.' };
    } catch (error: any) {
        return { success: false, message: `Server error: ${error.message}` };
    }
}
