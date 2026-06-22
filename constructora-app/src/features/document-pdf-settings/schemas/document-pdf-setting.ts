import * as z from 'zod';
import type { DocumentPdfLayout, DocumentPdfLogoSize } from '../api/types';

const DOCUMENT_PDF_LAYOUTS = ['CLASSIC', 'ACCENT', 'COMPACT'] as const;
const DOCUMENT_PDF_LOGO_SIZES = ['SMALL', 'MEDIUM', 'LARGE'] as const;

export const documentPdfSettingSchema = z.object({
  layout: z.enum(DOCUMENT_PDF_LAYOUTS),
  primaryColor: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Ingresá un color hexadecimal válido'),
  logoSize: z.enum(DOCUMENT_PDF_LOGO_SIZES),
});

export type DocumentPdfSettingFormValues = z.infer<typeof documentPdfSettingSchema>;

export const DOCUMENT_PDF_LAYOUT_LABELS: Record<DocumentPdfLayout, string> = {
  CLASSIC: 'Clásico',
  ACCENT: 'Acento',
  COMPACT: 'Compacto',
};

export const DOCUMENT_PDF_LAYOUT_DESCRIPTIONS: Record<DocumentPdfLayout, string> = {
  CLASSIC: 'Cabecera limpia con resumen tradicional y total destacado.',
  ACCENT: 'Mayor presencia visual del color del tenant en cabecera y resumen.',
  COMPACT: 'Versión más operativa, con bloques comprimidos para presupuestos largos.',
};

export const DOCUMENT_PDF_LOGO_SIZE_LABELS: Record<DocumentPdfLogoSize, string> = {
  SMALL: 'Chico',
  MEDIUM: 'Mediano',
  LARGE: 'Grande',
};

export const DOCUMENT_PDF_LOGO_SIZE_CLASSES: Record<DocumentPdfLogoSize, string> = {
  SMALL: 'max-h-10 max-w-28',
  MEDIUM: 'max-h-16 max-w-40',
  LARGE: 'max-h-24 max-w-56',
};
