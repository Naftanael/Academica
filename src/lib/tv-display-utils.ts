/**
 * @file src/lib/tv-display-utils.ts
 * @description Fornece funções de utilitário robustas para filtrar grupos de turmas para o painel de TV.
 *              Isto inclui a lógica crítica para lidar com o cenário "após a meia-noite" para os turnos da noite.
 */

import type { TvDisplayInfo, DayOfWeek, PeriodOfDay } from '@/types';
import { isWithinInterval, parseISO, endOfDay, getDay, getHours, subDays } from 'date-fns';
import { JS_DAYS_OF_WEEK_MAP_TO_PT } from '@/lib/constants';

/**
 * O tipo de dados principal usado pelos componentes do cliente do Painel de TV.
 * É um alias para a interface TvDisplayInfo para maior clareza.
 */
export type ClientTvDisplayInfo = TvDisplayInfo;

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
  const { effectiveDate, effectiveShift } = getEffectiveShiftAndDate(currentTime);

  if (!effectiveShift || !Array.isArray(allGroups)) {
    return [];
  }

  const effectiveDayName = JS_DAYS_OF_WEEK_MAP_TO_PT[getDay(effectiveDate)] as DayOfWeek;

  return allGroups.filter(group => {
    const isActive = group.status === 'Em Andamento';

    const isInDateRange =
      isValidDate(group.startDate) &&
      isValidDate(group.endDate) &&
      isWithinInterval(effectiveDate, {
        start: parseISO(group.startDate),
        end: endOfDay(parseISO(group.endDate)),
      });
      
    // **FIX:** Add a check to ensure group.classDays is an array
    if (!isActive || !isInDateRange || !Array.isArray(group.classDays)) {
      return false;
    }

    let isCorrectDayAndShift = false;

    if (effectiveDayName === 'Sábado') {
      if (effectiveShift === 'Tarde' && group.classDays.includes('Sábado')) {
        if (group.shift === 'Tarde' || group.shift === 'Noite') {
          isCorrectDayAndShift = true;
        }
      }
      else if (effectiveShift === 'Noite') {
        isCorrectDayAndShift = false;
      }
      else if (group.classDays.includes('Sábado') && group.shift === effectiveShift) {
        isCorrectDayAndShift = true;
      }
    }
    else {
      if (group.classDays.includes(effectiveDayName) && group.shift === effectiveShift) {
        isCorrectDayAndShift = true;
      }
    }

    return isCorrectDayAndShift;
  });
}
