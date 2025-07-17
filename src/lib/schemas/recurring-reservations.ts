
import { z } from 'zod';

/**
 * Schema for validating the recurring reservation form data.
 * This schema uses `z.coerce.date()` to safely convert and validate date strings,
 * which is more robust and simpler than manual parsing with regex and refine.
 */
export const recurringReservationFormSchema = z.object({
  classGroupId: z.string().min(1, { message: "Por favor, selecione uma turma." }),
  classroomId: z.string().min(1, { message: "Por favor, selecione uma sala de aula." }),
  
  // Coerce the date string from the form into a Date object.
  // This handles validation automatically. If the date is invalid, Zod will catch it.
  startDate: z.coerce.date({
    errorMap: () => ({ message: "Por favor, selecione uma data de início válida." }),
  }),

  numberOfClasses: z.preprocess(
    // Allows the field to be empty initially without a validation error.
    (val) => (val === '' ? undefined : val),
    z.coerce
      .number({ invalid_type_error: "O número de aulas deve ser um valor numérico." })
      .positive({ message: "O número de aulas deve ser maior que zero." })
      .min(1, "A reserva deve ter pelo menos 1 aula.")
      .max(100, "O número máximo de aulas por reserva recorrente é 100.")
  ),
  
  purpose: z.string()
    .min(3, { message: "O propósito deve ter pelo menos 3 caracteres." })
    .max(100, { message: "O propósito não pode exceder 100 caracteres." }),
});

// The server-side schema can be the same as the form schema for this case.
export const recurringReservationSchema = recurringReservationFormSchema;

export type RecurringReservationFormValues = z.infer<typeof recurringReservationFormSchema>;
