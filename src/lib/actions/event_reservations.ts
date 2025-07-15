/**
 * @file Define as Server Actions para gerenciar as reservas de eventos pontuais.
 * Similar a outras actions, estas funções rodam no servidor e são chamadas
 * diretamente dos componentes, simplificando a interação com o banco de dados
 * para criar, ler e deletar reservas de eventos.
 * A lógica de verificação de conflitos é a parte mais crítica deste arquivo.
 */
'use server';

// Importações de bibliotecas e módulos.
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { FieldValue } from 'firebase-admin/firestore';
import { parseISO, getDay, isWithinInterval } from 'date-fns'; // Funções para manipulação de datas.

// Importações internas do projeto.
import { db } from '@/lib/firebase/firebaseAdmin'; // Instância do Firestore Admin.
import {
  eventReservationFormSchema,
  type EventReservationFormValues,
} from '@/lib/schemas/event_reservations'; // Esquema de validação Zod.
import {
  SHIFT_TIME_RANGES,
  JS_DAYS_OF_WEEK_MAP_TO_PT,
} from '@/lib/constants'; // Constantes da aplicação (horários, mapeamento de dias).
import { timeRangesOverlap } from '@/lib/utils'; // Função utilitária para checar sobreposição de horários.
import type {
  EventReservation,
  ClassroomRecurringReservation,
  ClassGroup,
} from '@/types'; // Tipagens de dados.

// Referências para as coleções do Firestore para facilitar o acesso.
const eventReservationsCollection = db.collection('event_reservations');
const recurringReservationsCollection = db.collection('recurring_reservations');
const classGroupsCollection = db.collection('classgroups');
const classroomsCollection = db.collection('classrooms');

/**
 * Converte um documento do Firestore para o tipo `EventReservation`.
 * @param doc - O snapshot do documento do Firestore.
 * @returns Um objeto `EventReservation`.
 * @throws Lança um erro se o documento não tiver dados.
 */
const docToEventReservation = (
  doc: FirebaseFirestore.DocumentSnapshot,
): EventReservation => {
  const data = doc.data();
  if (!data) {
    throw new Error(
      `Dados não encontrados para o documento com ID ${doc.id}`,
    );
  }
  // Combina o ID do documento com seus dados para formar o objeto completo.
  return { id: doc.id, ...data } as EventReservation;
};

/**
 * Busca todas as reservas de eventos, ordenadas pela data em ordem decrescente.
 * @returns Uma promessa que resolve para um array de `EventReservation`.
 * @throws Lança um erro se a busca no banco de dados falhar.
 */
export async function getEventReservations(): Promise<EventReservation[]> {
  try {
    const snapshot = await eventReservationsCollection
      .orderBy('date', 'desc')
      .get();
    return snapshot.docs.map(docToEventReservation);
  } catch (error) {
    console.error(
      'Erro ao buscar reservas de eventos no Firestore:',
      error,
    );
    throw new Error('Falha ao buscar os dados das reservas de eventos.');
  }
}

/**
 * Cria uma nova reserva de evento, realizando uma verificação completa de conflitos
 * de horário dentro de uma transação atômica do Firestore.
 * @param prevState - Estado anterior do formulário (não utilizado).
 * @param values - Dados da reserva a serem criados.
 * @returns Um objeto com o resultado da operação (sucesso, mensagem, erros).
 */
export async function createEventReservation(
  prevState: any,
  values: EventReservationFormValues,
) {
  // 1. Validação dos Dados de Entrada:
  const validatedFields = eventReservationFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      message:
        'Erro de validação. Por favor, verifique os campos do formulário.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { date, classroomId, startTime, endTime } = validatedFields.data;
  const newEventDate = parseISO(date); // Converte a data string para um objeto Date.
  const newEventDayOfWeekPt =
    JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(newEventDate)]; // Mapeia o dia da semana para o formato em português.

  try {
    // Inicia uma transação do Firestore. Todas as leituras e escritas dentro
    // desta função ou acontecerão com sucesso (commit) ou falharão juntas (rollback).
    // Isso garante a consistência dos dados e evita "race conditions".
    await db.runTransaction(async (transaction) => {
      // ETAPA 1: Verificar conflitos com outras reservas de EVENTOS PONTUAIS.
      const eventConflictQuery = eventReservationsCollection
        .where('classroomId', '==', classroomId)
        .where('date', '==', date);
      const eventConflictSnapshot = await transaction.get(eventConflictQuery);

      for (const doc of eventConflictSnapshot.docs) {
        const existingEvent = doc.data() as EventReservation;
        if (
          timeRangesOverlap(
            startTime,
            endTime,
            existingEvent.startTime,
            existingEvent.endTime,
          )
        ) {
          const classroomDoc = await transaction.get(
            classroomsCollection.doc(classroomId),
          );
          // Se um conflito for encontrado, uma exceção é lançada. Isso
          // interromperá e reverterá (rollback) a transação automaticamente.
          throw new Error(
            `Conflito: A sala "${
              classroomDoc.data()?.name || 'desconhecida'
            }" já possui o evento "${
              existingEvent.title
            }" neste horário.`,
          );
        }
      }

      // ETAPA 2: Verificar conflitos com RESERVAS RECORRENTES de turmas.
      const recurringConflictQuery = recurringReservationsCollection.where(
        'classroomId',
        '==',
        classroomId,
      );
      const recurringSnapshot = await transaction.get(recurringConflictQuery);

      for (const doc of recurringSnapshot.docs) {
        const recurringRes = doc.data() as ClassroomRecurringReservation;
        // Verifica se a data do novo evento está dentro do período de uma reserva recorrente.
        if (
          isWithinInterval(newEventDate, {
            start: parseISO(recurringRes.startDate),
            end: parseISO(recurringRes.endDate),
          })
        ) {
          const classGroupDoc = await transaction.get(
            classGroupsCollection.doc(recurringRes.classGroupId),
          );
          if (!classGroupDoc.exists) continue; // Pula se a turma associada não for encontrada.

          const classGroup = classGroupDoc.data() as ClassGroup;
          // Verifica se a reserva recorrente ocorre no mesmo dia da semana do novo evento.
          if (classGroup.classDays?.includes(newEventDayOfWeekPt)) {
            const shiftTimeRange = SHIFT_TIME_RANGES[classGroup.shift];
            if (
              timeRangesOverlap(
                startTime,
                endTime,
                shiftTimeRange.start,
                shiftTimeRange.end,
              )
            ) {
              const classroomDoc = await transaction.get(
                classroomsCollection.doc(classroomId),
              );
              // Lança uma exceção para reverter a transação em caso de conflito.
              throw new Error(
                `Conflito: A sala "${
                  classroomDoc.data()?.name || 'desconhecida'
                }" possui uma reserva recorrente para a turma "${
                  classGroup.name
                }" neste dia e turno.`,
              );
            }
          }
        }
      }

      // ETAPA 3: Se nenhum conflito foi encontrado, cria a nova reserva.
      // Como estamos em uma transação, a escrita só será efetivada (commit) no final.
      const newEventRef = eventReservationsCollection.doc();
      transaction.set(newEventRef, {
        ...validatedFields.data,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    // 2. Revalidação do Cache:
    // Invalida o cache das páginas relevantes para que a nova reserva apareça na UI.
    revalidatePath('/reservations');
    revalidatePath('/room-availability');

    // 3. Resposta de Sucesso:
    return { success: true, message: 'Reserva de evento criada com sucesso!' };
  } catch (error: any) {
    console.error('Falha ao criar reserva de evento:', error);
    // Retorna a mensagem de erro específica que foi lançada de dentro da transação.
    // Isso fornece um feedback claro e direto para o usuário sobre o conflito.
    return {
      success: false,
      message:
        error.message ||
        'Ocorreu um erro inesperado no servidor ao criar a reserva.',
    };
  }
}

/**
 * Deleta uma reserva de evento do Firestore.
 * @param id - O ID da reserva a ser deletada.
 * @returns Um objeto com o resultado da operação (sucesso e mensagem).
 */
export async function deleteEventReservation(id: string) {
  try {
    await eventReservationsCollection.doc(id).delete();

    // Revalida o cache para refletir a exclusão na UI.
    revalidatePath('/reservations');
    revalidatePath('/room-availability');
    return {
      success: true,
      message: 'Reserva de evento excluída com sucesso!',
    };
  } catch (error) {
    console.error(
      `Falha ao deletar a reserva de evento ${id}:`,
      error,
    );
    return {
      success: false,
      message: 'Ocorreu um erro inesperado no servidor ao excluir a reserva.',
    };
  }
}
