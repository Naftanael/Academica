import { z } from 'zod';
import { parseISO, isBefore, isEqual } from 'date-fns';
import { CLASS_GROUP_SHIFTS } from '@/lib/constants';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD.");

export const recurringReservationFormSchema = z.object({
  classGroupId: z.string().min(1, "Selecione uma turma."),
  classroomId: z.string().min(1, "Selecione uma sala."),
  startDate: dateStringSchema.refine(val => !isNaN(parseISO(val).getTime()), {
    message: "Data de início inválida.",
  }),
  numberOfClasses: z.coerce
    .number({ invalid_type_error: "O número de aulas deve ser um número." })
    .min(1, "A reserva deve ter pelo menos 1 aula.")
    .max(100, "O número máximo de aulas por reserva é 100."), // Added a safeguard
  shift: z.enum(CLASS_GROUP_SHIFTS, {
    required_error: "Selecione um turno.",
    invalid_type_error: "Turno inválido."
  }),
  purpose: z.string().min(3, "O propósito deve ter pelo menos 3 caracteres.").max(100, "Propósito muito longo."),
});

export type RecurringReservationFormValues = z.infer<typeof recurringReservationFormSchema>;
