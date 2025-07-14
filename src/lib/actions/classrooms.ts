
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Importa a instância do Firestore
import { db } from '@/lib/firebase/admin';
// Importa tipos e schemas existentes
import type { Classroom } from '@/types'; // Manter os tipos existentes
import { classroomCreateSchema, classroomEditSchema, type ClassroomCreateValues, type ClassroomEditFormValues } from '@/lib/schemas/classrooms';

// Importações temporárias para verificações de exclusão (Serão refatoradas depois)
// Por enquanto, mantemos a leitura dos arquivos JSON antigos para estas verificações.
// IMPORTANTE: Isto só funcionará temporariamente no dev. Precisamos migrar esses dados para o Firestore também.
import { readData } from '@/lib/data-utils';
import type { ClassGroup, EventReservation, ClassroomRecurringReservation } from '@/types';

// Note: createLock e releaseLock não são mais necessários com Firestore

// Define a referência para a coleção de salas de aula no Firestore
const classroomsCollection = db.collection('classrooms');

export async function getClassrooms(): Promise<Classroom[]> {
  try {
    // Busca todos os documentos na coleção 'classrooms'
    // Opcional: Adicionar ordenação se necessário (ex: por nome)
    const snapshot = await classroomsCollection.orderBy('name').get();

    // Mapeia os documentos do Firestore para o formato de Classroom esperado
    const classrooms: Classroom[] = snapshot.docs.map(doc => ({
      id: doc.id, // Usa o ID do documento do Firestore
      ...doc.data(), // Pega os outros campos do documento
      // Assegura que os campos booleanos e arrays tenham um valor padrão se ausentes
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
  const lock = await createLock('classrooms.json');
  try {
    const validatedValues = classroomCreateSchema.parse(values);

    // Cria um novo objeto de dados para o Firestore. O Firestore gerará o ID.
    const newClassroomData = {
      name: validatedValues.name,
      capacity: validatedValues.capacity,
      resources: validatedValues.resources || [],
      isLab: validatedValues.isLab || false,
      isUnderMaintenance: validatedValues.isUnderMaintenance ?? false,
      maintenanceReason: validatedValues.isUnderMaintenance ? (validatedValues.maintenanceReason || '') : '',
      // O Firestore adiciona automaticamente um campo de timestamp de criação/atualização, se configurado nas regras ou usando FieldValue.serverTimestamp()
      // Podemos adicionar um campo 'createdAt' manualmente se precisarmos ORDER BY por ele
       createdAt: new Date(), // Exemplo: Adiciona um campo de data de criação (Firestore converte para Timestamp)
    };

    // Adiciona um novo documento à coleção 'classrooms'. add() retorna a referência.
    const docRef = await classroomsCollection.add(newClassroomData);

    // Opcional: Obter o documento criado para retornar com o ID gerado pelo Firestore
     const newDoc = await docRef.get();
     const createdClassroom = {
       id: newDoc.id,
       ...newDoc.data(),
       isLab: newDoc.data()?.isLab ?? false,
       isUnderMaintenance: newDoc.data()?.isUnderMaintenance ?? false,
       resources: newDoc.data()?.resources ?? [],
       maintenanceReason: newDoc.data()?.maintenanceReason ?? '',
     } as Classroom;


    revalidatePath('/classrooms');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/'); // Dashboard uses classroom count
    return { success: true, message: 'Sala de aula criada com sucesso!', data: newClassroom };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao criar sala.', errors: error.flatten().fieldErrors };
    }
    console.error('Failed to create classroom:', error);
    return { success: false, message: 'Erro interno ao criar sala de aula.' };
  } finally {
    await releaseLock('classrooms.json', lock);
  }
}

// Função para atualizar uma sala de aula existente no Firestore
export async function updateClassroom(id: string, values: ClassroomEditFormValues) {
  const lock = await createLock('classrooms.json');
   // Não precisa de locks com Firestore
  try {
    const validatedValues = classroomEditSchema.parse(values);
    const classrooms = await readData<Classroom>('classrooms.json');

    // Obtém a referência para o documento específico
    const docRef = classroomsCollection.doc(id);
    // Verifica se o documento existe
    const classroomIndex = classrooms.findIndex(c => c.id === id);

    if (classroomIndex === -1) {
      return { success: false, message: 'Sala não encontrada para atualização.' };
    }

    const existingClassroom = classrooms[classroomIndex];
    const updatedClassroom: Classroom = {
      ...existingClassroom,
      name: validatedValues.name,
      capacity: validatedValues.capacity,
      isUnderMaintenance: validatedValues.isUnderMaintenance ?? existingClassroom.isUnderMaintenance ?? false,
      maintenanceReason: validatedValues.isUnderMaintenance ? (validatedValues.maintenanceReason || '') : '',
      // resources and isLab are not part of edit form, preserve existing
    };

    classrooms[classroomIndex] = updatedClassroom;
    await writeData<Classroom>('classrooms.json', classrooms);

    // Prepara os dados para atualização. Firestore mescla os campos.
    const updatedData = {
       name: validatedValues.name,
       capacity: validatedValues.capacity,
       isUnderMaintenance: validatedValues.isUnderMaintenance ?? doc.data()?.isUnderMaintenance ?? false, // Mantém valor existente se não fornecido
       maintenanceReason: validatedValues.isUnderMaintenance ? (validatedValues.maintenanceReason || '') : '',
       // resources e isLab não estão no schema de edit, não incluí-los aqui para não sobrescrever
    };

    // Atualiza o documento no Firestore
    await docRef.update(updatedData);

    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/'); // Dashboard
    return { success: true, message: 'Sala de aula atualizada com sucesso!', data: updatedClassroom };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: 'Erro de validação ao atualizar sala.', errors: error.flatten().fieldErrors };
    }
    console.error(`Failed to update classroom ${id}:`, error);
    return { success: false, message: 'Erro interno ao atualizar sala de aula.' };
  } finally {
    await releaseLock('classrooms.json', lock);
  }
}

// Função para excluir uma sala de aula do Firestore
export async function deleteClassroom(id: string) {
  const lock = await createLock('classrooms.json');
  // Não precisa de locks com Firestore
  try {
    // --- Verificações de Dependência (Ainda usam leitura de arquivo - Refatorar depois!) ---
    const classGroups = await readData<ClassGroup>('classgroups.json');
    if (classGroups.some(cg => cg.assignedClassroomId === id)) {
      return { success: false, message: 'Não é possível excluir a sala. Ela está atribuída a uma ou mais turmas.' };
    }

    const eventReservations = await readData<EventReservation>('event_reservations.json');
    if (eventReservations.some(er => er.classroomId === id)) {
        return { success: false, message: 'Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas de eventos.' };
    }

    const recurringReservations = await readData<ClassroomRecurringReservation>('recurring_reservations.json');
     if (recurringReservations.some(rr => rr.classroomId === id)) {
        return { success: false, message: 'Não é possível excluir a sala. Ela está sendo usada em uma ou mais reservas recorrentes.' };
    }
     // --- Fim das Verificações Temporárias ---

    // Obtém a referência para o documento específico
    const docRef = classroomsCollection.doc(id);

    // Verifica se a sala existe antes de tentar deletar
    const doc = await docRef.get();
     if (!doc.exists) {
       // Se não existe, considera sucesso, pois o objetivo é que ela não esteja lá
       console.warn(`Attempted to delete non-existent classroom with ID: ${id}`);
       return { success: true, message: 'Sala de aula excluída (ou já inexistente) com sucesso no Firestore!' };
     }

    // Deleta o documento do Firestore
    await docRef.delete();

    revalidatePath('/classrooms');
    revalidatePath('/room-availability');
    revalidatePath('/tv-display');
    revalidatePath('/reservations');
    revalidatePath('/'); // Dashboard
    return { success: true, message: 'Sala de aula excluída com sucesso!' };
  } catch (error) {
    console.error(`Failed to delete classroom ${id}:`, error);
    return { success: false, message: 'Erro interno ao excluir sala de aula.' };
  } finally {
    await releaseLock('classrooms.json', lock);
  }
}

export async function getClassroomById(id: string): Promise<Classroom | undefined> {
  try {
    // Obtém um documento específico pelo ID na coleção 'classrooms'
    const doc = await classroomsCollection.doc(id).get();

    // Se o documento não existir, retorna undefined
    if (!doc.exists) {
      return undefined;
    }

    // Mapeia os dados do documento para o formato de Classroom
    const classroomData = doc.data();

    // Retorna a sala de aula encontrada, assegurando valores padrão para campos opcionais
    return {
      id: doc.id, // Usa o ID do documento do Firestore
      ...classroomData, // Pega os outros campos
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
