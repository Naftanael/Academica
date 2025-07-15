import { z } from 'zod';

/**
 * Defines the schema for creating and editing a classroom.
 * This schema is used for form validation on both the client and server.
 */
export const classroomSchema = z.object({
  name: z.string().trim()
    .min(3, "O nome da sala deve ter pelo menos 3 caracteres.")
    .max(100, "O nome da sala é muito longo."),
  capacity: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({
      required_error: "A capacidade é obrigatória.",
      invalid_type_error: "A capacidade deve ser um número.",
    })
    .int("A capacidade deve ser um número inteiro.")
    .positive("A capacidade deve ser um número positivo.")
    .min(1, "A capacidade deve ser de pelo menos 1.")
  ),
  isUnderMaintenance: z.boolean().default(false).optional(),
  maintenanceReason: z.string().trim().optional(),
}).refine(data => {
    // If the classroom is under maintenance, a reason must be provided.
    if (data.isUnderMaintenance && (!data.maintenanceReason || data.maintenanceReason.trim().length < 5)) {
        return false;
    }
    return true;
}, {
    message: "O motivo da manutenção é obrigatório e deve ter pelo menos 5 caracteres.",
    path: ["maintenanceReason"], // Path to the field that the error message applies to
});

// Create a TypeScript type from the Zod schema
export type ClassroomFormValues = z.infer<typeof classroomSchema>;