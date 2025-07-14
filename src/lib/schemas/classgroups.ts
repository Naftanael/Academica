
import { z } from 'zod';

const ClassDaysEnum = z.enum(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]);

const ClassShiftEnum = z.enum(["Manhã", "Tarde", "Noite"]);
const ClassStatusEnum = z.enum(["Planejada", "Em Andamento", "Concluída", "Cancelada"]);

export const classGroupCreateSchema = z.object({
  name: z.string().min(1, { message: "O nome da turma é obrigatório." }),
  course: z.string().min(1, { message: "O nome do curso é obrigatório." }),
  classDays: z.array(ClassDaysEnum).min(1, { message: "Pelo menos um dia da semana deve ser selecionado." }),
  shift: ClassShiftEnum,
  startDate: z.string().refine(s => !isNaN(Date.parse(s)), { message: "Data de início inválida." }),
  endDate: z.string().refine(s => !isNaN(Date.parse(s)), { message: "Data de término inválida." }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Horário de início inválido (HH:MM)." }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Horário de término inválido (HH:MM)." }),
  status: ClassStatusEnum.default("Planejada"),
  assignedClassroomId: z.string().optional()
});

export const classGroupEditSchema = classGroupCreateSchema.partial().extend({
    id: z.string().optional()
});
