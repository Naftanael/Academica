
import { z } from 'zod';

const daysOfWeek = z.enum([
  "Segunda", 
  "Terça", 
  "Quarta", 
  "Quinta", 
  "Sexta", 
  "Sábado", 
  "Domingo"
]);

const baseClassGroupSchema = z.object({
  name: z.string().min(1, "O nome da turma é obrigatório."),
  subject: z.string().min(1, "O nome do curso é obrigatório."),
  shift: z.enum(["Manhã", "Tarde", "Noite"], {
    required_error: "O turno é obrigatório.",
  }),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  classDays: z.array(daysOfWeek).min(1, "Selecione pelo menos um dia de aula."),
  notes: z.string().optional(),
}).refine(data => data.startDate <= data.endDate, {
  message: "A data de início não pode ser posterior à data de fim.",
  path: ["endDate"],
});

export const classGroupCreateSchema = baseClassGroupSchema;
export const classGroupEditSchema = baseClassGroupSchema;
