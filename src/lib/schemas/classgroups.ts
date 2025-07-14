
import { z } from 'zod';
import { CLASS_GROUP_STATUSES, DAYS_OF_WEEK, PERIODS_OF_DAY } from '@/lib/constants';

// Base schema for shared fields
const baseClassGroupSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }),
  shift: z.enum(PERIODS_OF_DAY, { required_error: "Selecione um turno." }),
  classDays: z.array(z.enum(DAYS_OF_WEEK))
    .min(1, { message: "Selecione pelo menos um dia da semana." }),
  year: z.coerce.number({ invalid_type_error: "Ano deve ser um número." })
                 .min(2022, { message: "O ano não pode ser anterior a 2022."})
                 .max(new Date().getFullYear() + 10, { message: "Ano muito no futuro."}),
  status: z.enum(CLASS_GROUP_STATUSES, { required_error: "Selecione um status." }),
  startDate: z.date({ required_error: "Data de início é obrigatória."}),
  endDate: z.date({ required_error: "Data de término é obrigatória."}),
  notes: z.string().max(500, "As observações não podem exceder 500 caracteres.").optional(),
});

// Schema for creating a class group
export const classGroupCreateSchema = baseClassGroupSchema.refine(data => {
  return data.startDate <= data.endDate;
}, {
  message: "A data de início não pode ser posterior à data de término.",
  path: ["endDate"],
});

// Schema for editing a class group (same as create for full editing capability)
export const classGroupEditSchema = baseClassGroupSchema.refine(data => {
  return data.startDate <= data.endDate;
}, {
  message: "A data de início não pode ser posterior à data de término.",
  path: ["endDate"],
});


export type ClassGroupCreateValues = z.infer<typeof classGroupCreateSchema>;
export type ClassGroupEditValues = z.infer<typeof classGroupEditSchema>;
