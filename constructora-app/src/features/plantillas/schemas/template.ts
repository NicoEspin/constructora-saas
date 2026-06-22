import * as z from 'zod';

export const templateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(160),
  description: z.string().max(2000).optional().or(z.literal('')),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

export const templateStageSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(160),
  description: z.string().max(2000).optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  weightPercent: z.number().min(0).max(100).optional(),
  tasks: z.array(z.object({ title: z.string().min(1, 'La tarea es requerida').max(240) })),
});

export type TemplateStageFormValues = z.infer<typeof templateStageSchema>;
