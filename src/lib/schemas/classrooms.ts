
import { z } from 'zod';

// Base schema for common fields, used for editing form and update action validation
export const classroomEditSchema = z.object({
  name: z.string().trim().min(1, { message: "O nome da sala é obrigatório." })
                 .min(3, { message: "O nome da sala deve ter pelo menos 3 caracteres." }),
  capacity: z.coerce.number({ invalid_type_error: "Capacidade deve ser um número." })
                     .int({ message: "A capacidade deve ser um número inteiro."})
                     .positive({ message: "A capacidade deve ser um número positivo."})
                     .min(1, { message: "A capacidade deve ser pelo menos 1." })
                     .optional(),
  isUnderMaintenance: z.boolean().optional(),
  maintenanceReason: z.string().trim().max(200, "O motivo da manutenção deve ter no máximo 200 caracteres.").optional(),
});
export type ClassroomEditFormValues = z.infer<typeof classroomEditSchema>;


// Schema for creating a classroom, extending the base/edit schema
export const classroomCreateSchema = classroomEditSchema.extend({
  resources: z.array(z.string().trim().min(1)).optional(),
  isLab: z.boolean().optional(),
  // isUnderMaintenance is inherited from classroomEditSchema and is optional
  // maintenanceReason is inherited from classroomEditSchema and is optional
});
export type ClassroomCreateValues = z.infer<typeof classroomCreateSchema>;
