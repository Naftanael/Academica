
import { z } from 'zod';

const daysOfWeek = z.enum(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]);

export const classGroupCreateSchema = z.object({
  name: z.string().min(1, "O nome da turma é obrigatório."),
  shift: z.enum(["Manhã", "Tarde", "Noite"], {
    required_error: "O turno é obrigatório.",
  }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de início inválida.",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data de fim inválida.",
  }),
  classDays: z.array(daysOfWeek).min(1, "Selecione pelo menos um dia de aula."),
  status: z.enum(["Planejada", "Em Andamento", "Concluída", "Cancelada"]).optional(),
  notes: z.string().optional(),
});


export const classGroupEditSchema = classGroupCreateSchema.extend({
    id: z.string(),
    notes: z.string().optional(),
});
