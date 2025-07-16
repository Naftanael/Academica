
/**
 * @file Manages all server-side actions for class groups using Firestore.
 */
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firestore';
import { classGroupSchema } from '@/lib/schemas/classgroups';
import type { ClassGroup } from '@/types';

type FormState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Creates a new class group document in Firestore.
 */
export async function createClassGroup(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = classGroupSchema.safeParse({
    name: formData.get('name'),
    classroomId: formData.get('classroomId'),
    subject: formData.get('subject'),
    teacher: formData.get('teacher'),
    students: Number(formData.get('students')),
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // FIRESTORE LOGIC: Add the new class group data to the 'classgroups' collection.
    await db.collection('classgroups').add(validatedFields.data);

    revalidatePath('/classgroups');
    return { success: true, message: 'Class group created successfully!' };
  } catch (error) {
    console.error('Error creating class group:', error);
    return { success: false, message: 'Server Error: Failed to create class group.' };
  }
}

/**
 * Fetches all class groups from Firestore and enriches them with classroom names.
 */
export async function getClassGroups(): Promise<(ClassGroup & { classroomName?: string })[]> {
  try {
    const classGroupsSnapshot = await db.collection('classgroups').get();
    if (classGroupsSnapshot.empty) {
      return [];
    }

    // Create an array of promises to fetch the classroom name for each class group
    const classGroupsPromises = classGroupsSnapshot.docs.map(async (doc) => {
      const classGroup = { id: doc.id, ...doc.data() } as ClassGroup;
      
      let classroomName = 'Unassigned';
      if (classGroup.assignedClassroomId) {
        const classroomDoc = await db.collection('classrooms').doc(classGroup.assignedClassroomId).get();
        if (classroomDoc.exists) {
          classroomName = classroomDoc.data()?.name || 'Unknown';
        }
      }
      
      return { ...classGroup, classroomName };
    });

    return Promise.all(classGroupsPromises);
  } catch (error) {
    console.error('Error fetching class groups:', error);
    return [];
  }
}

/**
 * Fetches a single class group by its ID from Firestore.
 */
export async function getClassGroupById(id: string): Promise<ClassGroup | null> {
    if (!id) return null;
    try {
        const docSnap = await db.collection('classgroups').doc(id).get();
        if (!docSnap.exists) {
            return null;
        }
        return { id: docSnap.id, ...docSnap.data() } as ClassGroup;
    } catch (error) {
        console.error(`Error fetching class group with ID ${id}:`, error);
        return null;
    }
}

/**
 * Updates a class group document in Firestore.
 */
export async function updateClassGroup(id: string, prevState: FormState, formData: FormData): Promise<FormState> {
    const validatedFields = classGroupSchema.safeParse({
        name: formData.get('name'),
        classroomId: formData.get('classroomId'),
        subject: formData.get('subject'),
        teacher: formData.get('teacher'),
        students: Number(formData.get('students')),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Validation failed.',
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        await db.collection('classgroups').doc(id).update(validatedFields.data);
        revalidatePath('/classgroups');
        revalidatePath(`/classgroups/${id}/edit`);
        return { success: true, message: 'Class group updated successfully.' };
    } catch (error) {
        console.error(`Error updating class group with ID ${id}:`, error);
        return { success: false, message: 'Server Error: Failed to update class group.' };
    }
}


/**
 * Deletes a class group document from Firestore.
 */
export async function deleteClassGroup(id: string): Promise<{ success: boolean; message: string }> {
  if (!id) {
    return { success: false, message: 'Class group ID is required.' };
  }
  try {
    await db.collection('classgroups').doc(id).delete();
    revalidatePath('/classgroups');
    return { success: true, message: 'Class group deleted successfully.' };
  } catch (error) {
    console.error(`Error deleting class group with ID ${id}:`, error);
    return { success: false, message: 'Server Error: Failed to delete class group.' };
  }
}

/**
 * Changes the classroom for a specific class group.
 */
export async function changeClassroom(classGroupId: string, newClassroomId: string): Promise<{ success: boolean; message: string }> {
    if (!classGroupId || !newClassroomId) {
        return { success: false, message: "Class group ID and new classroom ID are required." };
    }
    try {
        await db.collection('classgroups').doc(classGroupId).update({ assignedClassroomId: newClassroomId });
        revalidatePath('/classgroups');
        return { success: true, message: "Classroom changed successfully." };
    } catch (error) {
        console.error(`Error changing classroom for class group ${classGroupId}:`, error);
        return { success: false, message: "Server Error: Failed to change classroom." };
    }
}

export async function unassignClassroomFromClassGroup(classGroupId: string): Promise<{ success: boolean; message: string }> {
  if (!classGroupId) {
    return { success: false, message: "Class group ID is required." };
  }
  try {
    await db.collection('classgroups').doc(classGroupId).update({ assignedClassroomId: null });
    revalidatePath('/classgroups');
    return { success: true, message: "Classroom unassigned successfully." };
  } catch (error) {
    console.error(`Error unassigning classroom for class group ${classGroupId}:`, error);
    return { success: false, message: "Server Error: Failed to unassign classroom." };
  }
}
