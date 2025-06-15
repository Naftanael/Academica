import type { DayOfWeek, PeriodOfDay } from "@/types";

export const DAYS_OF_WEEK: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
export const JS_DAYS_OF_WEEK_MAP_TO_PT: DayOfWeek[] = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const PERIODS_OF_DAY: PeriodOfDay[] = ['Manhã', 'Tarde', 'Noite'];
export const CLASS_GROUP_STATUSES: string[] = ['Planejada', 'Em Andamento', 'Concluída', 'Cancelada'];
export const CLASS_GROUP_SHIFTS: PeriodOfDay[] = ['Manhã', 'Tarde', 'Noite'];

export const SHIFT_TIME_RANGES: Record<PeriodOfDay, { start: string; end: string }> = {
  'Manhã': { start: '06:00', end: '11:59' },
  'Tarde': { start: '12:00', end: '17:59' },
  'Noite': { start: '18:00', end: '23:59' },
};
