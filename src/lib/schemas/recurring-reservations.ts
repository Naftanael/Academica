
import { z } from 'zod';
import { parseISO, isBefore, isEqual } from 'date-fns'; // Using parseISO for robust date parsing
import { CLASS_GROUP_SHIFTS } from '@/lib/constants'; // Import shifts for enum

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD.");

export const recurringReservationFormSchema = z.object({
  classGroupId: z.string().min(1, "Selecione uma turma."),
  classroomId: z.string().min(1, "Selecione uma sala."),
  startDate: dateStringSchema.refine(val => !isNaN(parseISO(val).getTime()), {
    message: "Data de início inválida.",
  }),
  endDate: dateStringSchema.refine(val => !isNaN(parseISO(val).getTime()), {
    message: "Data de fim inválida.",
  }),
  shift: z.enum(CLASS_GROUP_SHIFTS as [string, ...string[]], { // Use imported shifts
    required_error: "Selecione um turno.",
    invalid_type_error: "Turno inválido."
  }),
  purpose: z.string().min(3, "O propósito deve ter pelo menos 3 caracteres.").max(100, "Propósito muito longo."),
}).refine(data => {
  try {
    const start = parseISO(data.startDate);
    const end = parseISO(data.endDate);
    return isBefore(start, end) || isEqual(start, end);
  } catch (e) {
    return false; 
  }
}, {
  message: "A data de início deve ser anterior ou igual à data de fim.",
  path: ["endDate"],
});
// Removed refine for startTime < endTime as these fields are removed

export type RecurringReservationFormValues = z.infer<typeof recurringReservationFormSchema>;

