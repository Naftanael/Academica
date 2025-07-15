/**
 * @file Este arquivo define as "Server Actions" para gerenciar as salas de aula.
 * As Server Actions são funções que rodam exclusivamente no servidor e podem ser
 * chamadas diretamente de componentes React (Client ou Server Components).
 * Isso simplifica o desenvolvimento de operações de escrita de dados (Criação,
 * Atualização, Exclusão) e a lógica de negócios associada, sem a necessidade
 * de criar rotas de API manualmente.
 *
 * As funções aqui implementam o CRUD (Create, Read, Update, Delete) para as
 * salas de aula no banco de dados Firestore.
 */
'use server';

// Importações de bibliotecas e módulos necessários.
import { z } from 'zod'; // Biblioteca para validação de esquemas de dados.
import { revalidatePath } from 'next/cache'; // Função do Next.js para invalidar o cache e atualizar a UI.
import { FieldValue } from 'firebase-admin/firestore'; // Para usar valores especiais do Firestore, como timestamps.

import { db } from '@/lib/firebase/admin'; // Instância do Firestore Admin SDK.
import { classroomSchema } from '@/lib/schemas/classrooms'; // Esquema de validação Zod para salas de aula.
import type { Classroom } from '@/types'; // Tipagem TypeScript para uma sala de aula.

// Referência para a coleção 'classrooms' no Firestore.
// Manter essa referência em uma constante global no arquivo melhora a performance e a legibilidade.
const classroomsCollection = db.collection('classrooms');

/**
 * Converte um documento do Firestore (snapshot) para um objeto do tipo Classroom.
 * Esta função auxiliar garante a consistência da estrutura de dados em toda a aplicação.
 *
 * @param doc - O snapshot do documento do Firestore.
 * @returns Um objeto `Classroom` com os dados do documento.
 * @throws Lança um erro se o documento não contiver dados.
 */
const toClassroom = (doc: FirebaseFirestore.DocumentSnapshot): Classroom => {
  const data = doc.data();
  if (!data) {
    // É uma boa prática ter uma verificação para documentos vazios.
    throw new Error(`O documento ${doc.id} não possui dados.`);
  }
  // Mapeia os campos do documento para a interface Classroom.
  // Utiliza operadores de fallback (||) para garantir valores padrão para campos opcionais.
  return {
    id: doc.id,
    name: data.name,
    capacity: data.capacity,
    isUnderMaintenance: data.isUnderMaintenance || false,
    maintenanceReason: data.maintenanceReason || '',
    resources: data.resources || [],
    isLab: data.isLab || false,
  };
};

/**
 * Define a tipagem para o estado dos formulários que usam estas Server Actions.
 * Isso é usado para passar o resultado da operação (sucesso, mensagem, erros)
 * de volta para o componente no cliente.
 */
type FormState = {
  success: boolean; // Indica se a operação foi bem-sucedida.
  message: string; // Mensagem de feedback para o usuário.
  errors?: Record<string, string[] | undefined>; // Erros de validação por campo.
};

/**
 * Cria uma nova sala de aula no banco de dados.
 * Esta função é uma Server Action e é projetada para ser usada com o hook `useFormState` do React.
 *
 * @param prevState - O estado anterior do formulário (não utilizado aqui, mas exigido pelo `useFormState`).
 * @param values - Os dados da nova sala de aula a serem validados e salvos.
 * @returns Um objeto `FormState` com o resultado da operação.
 */
export async function createClassroom(
  prevState: any,
  values: z.infer<typeof classroomSchema>,
): Promise<FormState> {
  // 1. Validação dos Dados:
  // Utiliza o Zod para validar os dados recebidos do formulário contra o esquema definido.
  const validatedFields = classroomSchema.safeParse(values);

  // Se a validação falhar, retorna imediatamente com os detalhes dos erros.
  if (!validatedFields.success) {
    return {
      success: false,
      message:
        'Erro de validação. Por favor, verifique os campos do formulário.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name } = validatedFields.data;

  try {
    // 2. Lógica de Negócios:
    // Verifica se já existe uma sala com o mesmo nome para evitar duplicatas.
    const existingClassroomQuery = await classroomsCollection
      .where('name', '==', name)
      .limit(1)
      .get();
    if (!existingClassroomQuery.empty) {
      return {
        success: false,
        message: 'Já existe uma sala de aula com este nome.',
      };
    }

    // 3. Operação no Banco de Dados:
    // Adiciona o novo documento à coleção 'classrooms'.
    // Inclui um timestamp do servidor para o campo 'createdAt'.
    await classroomsCollection.add({
      ...validatedFields.data,
      createdAt: FieldValue.serverTimestamp(),
    });

    // 4. Revalidação do Cache:
    // Informa ao Next.js para invalidar o cache da página de listagem de salas.
    // Isso fará com que os dados sejam recarregados na próxima visita, exibindo a nova sala.
    revalidatePath('/classrooms');

    // 5. Resposta de Sucesso:
    return { success: true, message: 'Sala de aula criada com sucesso!' };
  } catch (error) {
    console.error('Erro ao criar a sala de aula:', error);
    // Em caso de erro inesperado no servidor, retorna uma mensagem genérica.
    return {
      success: false,
      message: 'Ocorreu um erro inesperado no servidor. Tente novamente.',
    };
  }
}

/**
 * Busca todas as salas de aula no banco de dados.
 *
 * @returns Uma promessa que resolve para um array de objetos `Classroom`.
 * @throws Lança um erro se a comunicação com o banco de dados falhar.
 */
export async function getClassrooms(): Promise<Classroom[]> {
  try {
    // Busca todos os documentos da coleção, ordenados pelo nome em ordem ascendente.
    const snapshot = await classroomsCollection.orderBy('name', 'asc').get();
    // Mapeia cada documento para o formato `Classroom` usando a função auxiliar `toClassroom`.
    return snapshot.docs.map(toClassroom);
  } catch (error) {
    console.error('Erro ao buscar as salas de aula:', error);
    // Relança o erro para que a camada que chamou a função possa tratá-lo (ex: exibir uma página de erro).
    throw new Error('Falha ao buscar os dados das salas de aula.');
  }
}

/**
 * Busca uma sala de aula específica pelo seu ID.
 *
 * @param id - O ID da sala de aula a ser buscada.
 * @returns Uma promessa que resolve para um objeto `Classroom` se encontrada, ou `null` caso contrário.
 * @throws Lança um erro se a comunicação com o banco de dados falhar.
 */
export async function getClassroomById(id: string): Promise<Classroom | null> {
  // Validação simples para evitar uma busca desnecessária se o ID for inválido.
  if (!id) return null;

  try {
    // Busca o documento específico pelo seu ID.
    const doc = await classroomsCollection.doc(id).get();
    // Se o documento existir, converte para o tipo `Classroom`, senão retorna `null`.
    return doc.exists ? toClassroom(doc) : null;
  } catch (error) {
    console.error(`Erro ao buscar a sala de aula com ID ${id}:`, error);
    throw new Error(`Falha ao buscar os dados da sala de aula ${id}.`);
  }
}

/**
 * Atualiza os dados de uma sala de aula existente.
 *
 * @param id - O ID da sala de aula a ser atualizada.
 * @param prevState - O estado anterior do formulário (não utilizado).
 * @param values - Os novos dados da sala de aula a serem validados e salvos.
 * @returns Um objeto `FormState` com o resultado da operação.
 */
export async function updateClassroom(
  id: string,
  prevState: any,
  values: z.infer<typeof classroomSchema>,
): Promise<FormState> {
  // 1. Validação dos Dados:
  const validatedFields = classroomSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      message:
        'Erro de validação. Por favor, verifique os campos do formulário.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // 2. Operação no Banco de Dados:
    // Atualiza o documento no Firestore com os novos dados validados.
    // Inclui um timestamp do servidor para o campo 'updatedAt'.
    await classroomsCollection.doc(id).update({
      ...validatedFields.data,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 3. Revalidação do Cache:
    // Invalida o cache tanto da página de listagem quanto da página de edição da sala específica.
    revalidatePath('/classrooms');
    revalidatePath(`/classrooms/${id}/edit`);

    // 4. Resposta de Sucesso:
    return { success: true, message: 'Sala de aula atualizada com sucesso!' };
  } catch (error) {
    console.error(`Erro ao atualizar a sala de aula ${id}:`, error);
    return {
      success: false,
      message: 'Ocorreu um erro inesperado no servidor ao atualizar.',
    };
  }
}

/**
 * Deleta uma sala de aula do banco de dados.
 *
 * @param id - O ID da sala de aula a ser deletada.
 * @returns Um objeto com o resultado da operação (sucesso e mensagem).
 */
export async function deleteClassroom(
  id: string,
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Lógica de Negócios (Verificação de Dependência):
    // Antes de excluir, verifica se a sala de aula está sendo utilizada por alguma turma ('classgroup').
    // Isso previne a exclusão de dados que possuem referências em outras partes do sistema.
    const classGroupsQuery = await db
      .collection('classgroups')
      .where('assignedClassroomId', '==', id)
      .limit(1)
      .get();

    if (!classGroupsQuery.empty) {
      // Se a sala estiver em uso, a exclusão é bloqueada e uma mensagem informativa é retornada.
      return {
        success: false,
        message:
          'Não é possível excluir. A sala de aula está atualmente atribuída a uma ou mais turmas.',
      };
    }

    // 2. Operação no Banco de Dados:
    // Se não houver dependências, o documento é deletado.
    await classroomsCollection.doc(id).delete();

    // 3. Revalidação do Cache:
    // Invalida o cache para que a lista de salas seja atualizada na UI.
    revalidatePath('/classrooms');

    // 4. Resposta de Sucesso:
    return { success: true, message: 'Sala de aula excluída com sucesso.' };
  } catch (error) {
    console.error(`Erro ao deletar a sala de aula ${id}:`, error);
    return {
      success: false,
      message: 'Ocorreu um erro inesperado no servidor ao excluir.',
    };
  }
}
