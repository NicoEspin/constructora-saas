import * as z from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email('Email inválido').max(120).optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  taxId: z.string().max(50).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
