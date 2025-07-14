
import { z } from 'zod';

// Base schema for classroom properties, without the refinement.
// This allows it to be extended before the refinement is applied.
const classroomBaseSchema = z.object({
  name: z.string().trim()
    .min(1, "O nome da sala é obrigatório.")
    .min(3, "O nome da sala deve ter pelo menos 3 caracteres."),
  capacity: z.coerce.number({ invalid_type_error: "A capacidade deve ser um número." })
    .int("A capacidade deve ser um número inteiro.")
    .positive("A capacidade deve ser um número positivo.")
    .min(1, "A capacidade deve ser de pelo menos 1.")
    .optional(),
  isUnderMaintenance: z.boolean().optional(),
  maintenanceReason: z.string().trim()
    .max(200, "O motivo da manutenção não pode exceder 200 caracteres.")
    .optional(),
});

// The refinement logic to be applied to both edit and create schemas.
const maintenanceRefinement = (data: { isUnderMaintenance?: boolean, maintenanceReason?: string | null }) => {
    // If the classroom is under maintenance, a reason must be provided.
    if (data.isUnderMaintenance && (!data.maintenanceReason || data.maintenanceReason.trim().length === 0)) {
        return false;
    }
    return true;
};

const refinementOptions = {
    message: "O motivo da manutenção é obrigatório quando a sala está em manutenção.",
    path: ["maintenanceReason"], // Path to the field that the error message applies to
};

/**
 * Schema for editing a classroom.
 * Ensures that if a classroom is marked as under maintenance, a reason is provided.
 */
export const classroomEditSchema = classroomBaseSchema.refine(maintenanceRefinement, refinementOptions);

export type ClassroomEditFormValues = z.infer<typeof classroomEditSchema>;

/**
 * Schema for creating a new classroom.
 * Extends the base schema and applies the same refinement.
 */
export const classroomCreateSchema = classroomBaseSchema.extend({
  resources: z.array(z.string().trim().min(1, "O recurso não pode estar vazio.")).optional(),
  isLab: z.boolean().optional(),
}).refine(maintenanceRefinement, refinementOptions);

export type ClassroomCreateValues = z.infer<typeof classroomCreateSchema>;
