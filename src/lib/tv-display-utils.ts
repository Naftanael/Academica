/**
 * @file src/lib/tv-display-utils.ts
 * @description Fornece funções de utilitário robustas para filtrar grupos de turmas para o painel de TV.
 *              Isto inclui a lógica crítica para lidar com o cenário "após a meia-noite" para os turnos da noite.
 */

import type { TvDisplayInfo, ClassGroupStatus, DayOfWeek, PeriodOfDay } from '@/types';
import { isWithinInterval, parseISO, endOfDay, getDay, getHours, subDays } from 'date-fns';
import { JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';

/**
 * O tipo de dados principal usado pelos componentes do cliente do Painel de TV.
 * Ele combina a TvDisplayInfo base com o `status` necessário para a filtragem.
 */
export interface ClientTvDisplayInfo extends TvDisplayInfo {
  status: ClassGroupStatus;
}

/**
 * Determina o turno e a data efetivos para fins de filtragem.
 * Esta é a lógica central que lida com o caso "após a meia-noite", que é uma fonte comum de bugs em painéis como este.
 * Se a hora atual estiver entre a meia-noite e as 6 da manhã, a função assume corretamente
 * que ainda faz parte do turno da "Noite" do dia *anterior*.
 *
 * @param {Date} currentTime - A data e hora atuais.
 * @returns {{ effectiveDate: Date, effectiveShift: PeriodOfDay | null }} 
 *          Um objeto contendo a data e o turno corretos que devem ser usados para toda a lógica de filtragem.
 */
function getEffectiveShiftAndDate(currentTime: Date): { effectiveDate: Date; effectiveShift: PeriodOfDay | null } {
  const currentHour = getHours(currentTime);

  // CENÁRIO 1: Após a meia-noite, mas antes do início do turno da manhã (ex: 00:00-05:59).
  // Isto é tratado como uma extensão do turno da noite do dia anterior.
  if (currentHour >= 0 && currentHour < 6) {
    return {
      effectiveDate: subDays(currentTime, 1), // A data lógica é o dia anterior.
      effectiveShift: 'Noite',                // O turno lógico é "Noite".
    };
  }

  // CENÁRIO 2: Horas diurnas e noturnas padrão.
  let shift: PeriodOfDay | null = null;
  if (currentHour >= 6 && currentHour < 12) shift = 'Manhã';
  else if (currentHour >= 12 && currentHour < 18) shift = 'Tarde';
  else if (currentHour >= 18 && currentHour <= 23) shift = 'Noite';

  return {
    effectiveDate: currentTime, // A data lógica é hoje.
    effectiveShift: shift,      // O turno é determinado pela hora.
  };
}

/**
 * Verifica se uma determinada string de data é uma data ISO válida e analisável.
 * Esta é uma verificação defensiva para evitar erros de dados malformados.
 */
function isValidDate(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const date = parseISO(dateStr);
    return !isNaN(date.getTime());
}

/**
 * Filtra uma lista de todos os grupos de turmas para encontrar apenas aqueles que devem ser exibidos ativamente na TV.
 * Esta função orquestra todo o processo de filtragem usando a lógica robusta e consciente do tempo.
 *
 * @param {ClientTvDisplayInfo[]} allGroups - Uma matriz de todos os grupos de turmas disponíveis (com datas adaptadas ao ano atual).
 * @param {Date} currentTime - A data e hora atuais para filtrar.
 * @returns {ClientTvDisplayInfo[]} Uma matriz dos grupos que estão ativos e devem ser exibidos agora.
 */
export function filterActiveGroups(allGroups: ClientTvDisplayInfo[], currentTime: Date): ClientTvDisplayInfo[] {
  // Primeiro, determina a data e o turno lógicos corretos a serem usados para todas as verificações.
  const { effectiveDate } = getEffectiveShiftAndDate(currentTime);

  // Se não houver um turno válido (por exemplo, a função retornou nulo), nenhuma turma pode estar ativa.
  if (!Array.isArray(allGroups)) {
    return [];
  }

  // Determina o dia da semana correto com base na data lógica.
  const effectiveDayName = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(effectiveDate)] as DayOfWeek;

  return allGroups.filter(group => {
    // Condição 1: O grupo deve estar marcado como "Em Andamento".
    const isActive = group.status === 'Em Andamento';

    // Condição 3: O dia lógico atual deve ser um dos dias de aula programados do grupo.
    const isCorrectDay = Array.isArray(group.classDays) && group.classDays.includes(effectiveDayName);

    // Condição 4: A data lógica atual deve estar dentro da data de início e fim geral do grupo.
    const isInDateRange =
      isValidDate(group.startDate) &&
      isValidDate(group.endDate) &&
      isWithinInterval(effectiveDate, {
        start: parseISO(group.startDate),
        end: endOfDay(parseISO(group.endDate)), // Usa endOfDay para incluir todo o último dia.
      });

    // Um grupo é exibido apenas se todas as quatro condições forem verdadeiras.
    return isActive && isCorrectDay && isInDateRange;
  });
}
