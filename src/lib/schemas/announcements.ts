
import { z } from 'zod';

export const ANNOUNCEMENT_TYPES = ['Notícia', 'Comunicado'] as const;
export const ANNOUNCEMENT_PRIORITIES = ['Normal', 'Urgente'] as const;

export const announcementSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres.").max(150, "O título é muito longo."),
  content: z.string().min(10, "O conteúdo deve ter pelo menos 10 caracteres."),
  author: z.string().min(2, "O autor deve ter pelo menos 2 caracteres.").max(100, "O nome do autor é muito longo."),
  type: z.enum(ANNOUNCEMENT_TYPES, {
    required_error: "Selecione um tipo.",
  }),
  priority: z.enum(ANNOUNCEMENT_PRIORITIES, {
    required_error: "Selecione uma prioridade.",
  }),
  published: z.boolean().default(true),
});

export const announcementEditSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres.").max(150, "O título é muito longo."),
  content: z.string().min(10, "O conteúdo deve ter pelo menos 10 caracteres."),
});


export type AnnouncementFormValues = z.infer<typeof announcementSchema>;
export type AnnouncementEditFormValues = z.infer<typeof announcementEditSchema>;
