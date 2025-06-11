
import { z } from 'zod';
// import { DAYS_OF_WEEK } from '@/lib/constants'; // No longer needed here
// import type { DayOfWeek } from '@/types'; // No longer needed here
import { isBefore, isEqual } from 'date-fns';

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido. Use HH:MM.");

export const recurringReservationFormSchema = z.object({
  classGroupId: z.string().min(1, "Selecione uma turma."),
  classroomId: z.string().min(1, "Selecione uma sala."),
  startDate: z.string().min(1, "Data de início é obrigatória."),
  endDate: z.string().min(1, "Data de fim é obrigatória."),
  // dayOfWeek: z.enum(DAYS_OF_WEEK as [DayOfWeek, ...DayOfWeek[]], { required_error: "Selecione um dia da semana." }), // Removed
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  purpose: z.string().min(3, "O propósito deve ter pelo menos 3 caracteres.").max(100, "Propósito muito longo."),
}).refine(data => {
  // Ensure dates are valid before attempting to parse
  try {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false; // Invalid date strings
    return isBefore(start, end) || isEqual(start, end);
  } catch (e) {
    return false; // Error during date parsing
  }
}, {
  message: "A data de início deve ser anterior ou igual à data de fim.",
  path: ["endDate"],
}).refine(data => data.startTime < data.endTime, {
  message: "A hora de início deve ser anterior à hora de fim.",
  path: ["endTime"],
});

export type RecurringReservationFormValues = z.infer<typeof recurringReservationFormSchema>;
