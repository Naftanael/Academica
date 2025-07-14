
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';

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

        const newClassroom = await db.runTransaction(async (transaction) => {
            const existingClassroomQuery = classroomsCollection.where('name', '==', validatedValues.name);
            const existingClassroomSnapshot = await transaction.get(existingClassroomQuery);

            if (!existingClassroomSnapshot.empty) {
                throw new Error('Já existe uma sala de aula com este nome.');
            }

            const newClassroomRef = classroomsCollection.doc();
            const newClassroomData = {
                ...validatedValues,
                createdAt: FieldValue.serverTimestamp(),
            };

            transaction.set(newClassroomRef, newClassroomData);
            return { id: newClassroomRef.id, ...newClassroomData };
        });

        revalidatePath('/classrooms');
        revalidatePath('/room-availability');
        revalidatePath('/tv-display');
        revalidatePath('/');
        return { success: true, message: 'Sala de aula criada com sucesso!', data: newClassroom as Classroom };

    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Erro de validação ao criar sala.', errors: error.flatten().fieldErrors };
        }
        console.error('Failed to create classroom:', error);
        return { success: false, message: (error as Error).message || 'Erro interno ao criar sala de aula.' };
    }
}

export async function updateClassroom(id: string, values: ClassroomEditFormValues) {
    try {
        const validatedValues = classroomEditSchema.parse(values);
        const docRef = classroomsCollection.doc(id);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            if (!doc.exists) {
                throw new Error('Sala não encontrada para atualização.');
            }

            if (validatedValues.name && validatedValues.name !== doc.data()?.name) {
                const existingClassroomQuery = classroomsCollection.where('name', '==', validatedValues.name);
                const existingClassroomSnapshot = await transaction.get(existingClassroomQuery);
                if (!existingClassroomSnapshot.empty) {
                    throw new Error('Já existe uma sala de aula com este nome.');
                }
            }

            const updatedData = {
                ...validatedValues,
                isUnderMaintenance: validatedValues.isUnderMaintenance ?? doc.data()?.isUnderMaintenance ?? false,
                maintenanceReason: validatedValues.isUnderMaintenance ? (validatedValues.maintenanceReason || '') : '',
            };

            transaction.update(docRef, updatedData);
        });

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
        return { success: false, message: (error as Error).message || 'Erro interno ao atualizar sala de aula.' };
    }
}


export async function deleteClassroom(id: string) {
    try {
        await db.runTransaction(async (transaction) => {
            const docRef = classroomsCollection.doc(id);
            const doc = await transaction.get(docRef);

            if (!doc.exists) {
                // Se o documento não existe, não há nada a fazer.
                return;
            }

            const classGroupQuery = classGroupsCollection.where('assignedClassroomId', '==', id).limit(1);
            const eventReservationQuery = eventReservationsCollection.where('classroomId', '==', id).limit(1);
            const recurringReservationQuery = recurringReservationsCollection.where('classroomId', '==', id).limit(1);

            const [
                classGroupSnapshot,
                eventReservationSnapshot,
                recurringReservationSnapshot
            ] = await Promise.all([
                transaction.get(classGroupQuery),
                transaction.get(eventReservationQuery),
                transaction.get(recurringReservationQuery)
            ]);

            if (!classGroupSnapshot.empty) {
                throw new Error('Não é possível excluir a sala. Ela está atribuída a uma ou mais turmas.');
            }
            if (!eventReservationSnapshot.empty) {
                throw new Error('Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas de eventos.');
            }
            if (!recurringReservationSnapshot.empty) {
                throw new Error('Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas recorrentes.');
            }

            transaction.delete(docRef);
        });

        revalidatePath('/classrooms');
        revalidatePath('/room-availability');
        revalidatePath('/tv-display');
        revalidatePath('/reservations');
        revalidatePath('/');
        return { success: true, message: 'Sala de aula excluída com sucesso!' };

    } catch (error) {
        console.error(`Failed to delete classroom ${id}:`, error);
        return { success: false, message: (error as Error).message || 'Erro interno ao excluir sala de aula.' };
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
      createdAt: classroomData?.createdAt.toDate(),
      updatedAt: classroomData?.updatedAt?.toDate()
    } as Classroom;

  } catch (error) {
    console.error(`Failed to get classroom by ID ${id}:`, error);
    return undefined;
  }
}
