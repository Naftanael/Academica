
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Importa a instância do Firestore
import { db } from '@/lib/firebase/admin';
// Importa tipos e schemas existentes
import type { Classroom } from '@/types'; 
import { classroomCreateSchema, classroomEditSchema, type ClassroomCreateValues, type ClassroomEditFormValues } from '@/lib/schemas/classrooms';

// Define a referência para a coleção de salas de aula no Firestore
const classroomsCollection = db.collection('classrooms');
// Define referências para as coleções de dependência no Firestore
const classGroupsCollection = db.collection('classgroups');
const eventReservationsCollection = db.collection('event_reservations');
const recurringReservationsCollection = db.collection('recurring_reservations');


export async function getClassrooms(): Promise<Classroom[]> {
  try {
    const snapshot = await classroomsCollection.orderBy('name').get();
    const classrooms: Classroom[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isLab: doc.data().isLab ?? false,
      isUnderMaintenance: doc.data().isUnderMaintenance ?? false,
      resources: doc.data().resources ?? [],
      maintenanceReason: doc.data().maintenanceReason ?? '',
    })) as Classroom[];
    return classrooms;
  } catch (error) {
    console.error('Failed to get classrooms:', error);
    return [];
  }
}

export async function createClassroom(values: ClassroomCreateValues) {
  try {
    const validatedValues = classroomCreateSchema.parse(values);
    const newClassroomData = {
      ...validatedValues,
      createdAt: new Date(),
    };
    const docRef = await classroomsCollection.add(newClassroomData);
    const newDoc = await docRef.get();
    const createdClassroom = {
       id: newDoc.id,
       ...newDoc.data(),
    } as Classroom;

    revalidatePath('/classrooms');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/');
    return { success: true, message: 'Sala de aula criada com sucesso!', data: createdClassroom };

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
    const docRef = classroomsCollection.doc(id);

    const doc = await docRef.get();
    if (!doc.exists) {
        return { success: false, message: 'Sala não encontrada para atualização.' };
    }

    const updatedData = {
       name: validatedValues.name,
       capacity: validatedValues.capacity,
       isUnderMaintenance: validatedValues.isUnderMaintenance ?? doc.data()?.isUnderMaintenance ?? false,
       maintenanceReason: validatedValues.isUnderMaintenance ? (validatedValues.maintenanceReason || '') : '',
    };

    await docRef.update(updatedData);

    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/');
    return { success: true, message: 'Sala de aula atualizada com sucesso!' };

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
    // Verifica se a sala está atribuída a alguma turma
    const classGroupSnapshot = await classGroupsCollection.where('assignedClassroomId', '==', id).limit(1).get();
    if (!classGroupSnapshot.empty) {
      return { success: false, message: 'Não é possível excluir a sala. Ela está atribuída a uma ou mais turmas.' };
    }

    // Verifica se a sala está sendo usada em alguma reserva de evento
    const eventReservationsSnapshot = await eventReservationsCollection.where('classroomId', '==', id).limit(1).get();
    if (!eventReservationsSnapshot.empty) {
        return { success: false, message: 'Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas de eventos.' };
    }

    // Verifica se a sala está sendo usada em alguma reserva recorrente
    const recurringReservationsSnapshot = await recurringReservationsCollection.where('classroomId', '==', id).limit(1).get();
    if (!recurringReservationsSnapshot.empty) {
        return { success: false, message: 'Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas recorrentes.' };
    }

    const docRef = classroomsCollection.doc(id);
    const doc = await docRef.get();
     if (!doc.exists) {
       console.warn(`Attempted to delete non-existent classroom with ID: ${id}`);
       return { success: true, message: 'Sala de aula já não existia.' };
     }

    await docRef.delete();

    revalidatePath('/classrooms');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/reservations');
    revalidatePath('/');
    return { success: true, message: 'Sala de aula excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete classroom ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir sala de aula.' };
  }
}

export async function getClassroomById(id: string): Promise<Classroom | undefined> {
  try {
    const doc = await classroomsCollection.doc(id).get();
    if (!doc.exists) {
      return undefined;
    }
    const classroomData = doc.data();
    return {
      id: doc.id,
      ...classroomData,
      isLab: classroomData?.isLab ?? false,
      isUnderMaintenance: classroomData?.isUnderMaintenance ?? false,
      resources: classroomData?.resources ?? [],
      maintenanceReason: classroomData?.maintenanceReason ?? '',
    } as Classroom;

  } catch (error) {
    console.error(`Failed to get classroom by ID ${id}:`, error);
    return undefined;
  }
}
