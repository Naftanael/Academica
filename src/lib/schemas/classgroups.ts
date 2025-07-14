
import { z } from 'zod';
import { parseISO, isValid } from 'date-fns';

const daysOfWeek = z.enum(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]);
const dateStringSchema = z.string().refine((val) => isValid(parseISO(val)), {
    message: "Formato de data inválido.",
});

export const classGroupCreateSchema = z.object({
  name: z.string().min(1, "O nome da turma é obrigatório."),
  shift: z.enum(["Manhã", "Tarde", "Noite"], {
    required_error: "O turno é obrigatório.",
  }),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  classDays: z.array(daysOfWeek).min(1, "Selecione pelo menos um dia de aula."),
  notes: z.string().optional(),
}).refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: "A data de início não pode ser posterior à data de fim.",
    path: ["endDate"],
});


export const classGroupEditSchema = classGroupCreateSchema.extend({
    // A edição não precisa de um ID no formulário, mas a ação do servidor precisa.
    // Para consistência do formulário, o schema de edição é igual ao de criação.
});
