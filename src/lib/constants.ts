
import type { DayOfWeek, PeriodOfDay } from "@/types";

// Using `as const` provides a readonly tuple type that z.enum can correctly infer.
export const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const;
export const JS_DAYS_OF_WEEK_MAP_TO_PT: DayOfWeek[] = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const PERIODS_OF_DAY = ['Manhã', 'Tarde', 'Noite'] as const;
export const CLASS_GROUP_STATUSES = ['Planejada', 'Em Andamento', 'Concluída', 'Cancelada'] as const;
export const CLASS_GROUP_SHIFTS = ['Manhã', 'Tarde', 'Noite'] as const;

export const SHIFT_TIME_RANGES: Record<PeriodOfDay, { start: string; end: string }> = {
  'Manhã': { start: '06:00', end: '11:59' },
  'Tarde': { start: '12:00', end: '17:59' },
  'Noite': { start: '18:00', end: '23:59' },
};
