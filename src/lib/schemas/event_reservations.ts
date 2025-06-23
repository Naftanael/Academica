
import { z } from 'zod';
import { parseISO, isValid as isValidDate } from 'date-fns';

const timeStringSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido. Use HH:mm.");
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de data inválido. Use YYYY-MM-DD.")
  .refine(val => isValidDate(parseISO(val)), {
    message: "Data inválida.",
  });

export const eventReservationFormSchema = z.object({
  classroomId: z.string().min(1, "Selecione uma sala."),
  title: z.string().min(3, "O título do evento deve ter pelo menos 3 caracteres.").max(100, "Título muito longo."),
  date: dateStringSchema,
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  reservedBy: z.string().min(2, "O nome do responsável deve ter pelo menos 2 caracteres.").max(100, "Nome do responsável muito longo."),
  details: z.string().max(500, "Detalhes muito longos.").optional(),
}).refine(data => {
  const [startHour, startMinute] = data.startTime.split(':').map(Number);
  const [endHour, endMinute] = data.endTime.split(':').map(Number);
  return (startHour * 60 + startMinute) < (endHour * 60 + endMinute);
}, {
  message: "A hora de início deve ser anterior à hora de fim.",
  path: ["endTime"],
});

export type EventReservationFormValues = z.infer<typeof eventReservationFormSchema>;
