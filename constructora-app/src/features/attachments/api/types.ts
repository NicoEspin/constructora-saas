import type { DocumentPdfType } from '@/features/document-pdf-settings/api/types';

export type AttachmentKind =
  | 'INVOICE'
  | 'RECEIPT'
  | 'PAYMENT_PROOF'
  | 'PROGRESS_PHOTO'
  | 'PLAN'
  | 'CONTRACT'
  | 'SIGNED_BUDGET'
  | 'CLIENT_DOCUMENT'
  | 'OTHER';

export type AttachmentEntityType =
  | 'TENANT'
  | 'EXPENSE'
  | 'PROJECT'
  | 'PROJECT_INCOME'
  | 'PROJECT_STAGE'
  | 'CLIENT'
  | 'BUDGET'
  | 'DOCUMENT_PDF_SETTING';

export interface Attachment {
  id: string;
  tenantId: string;
  uploadedByUserId: string | null;
  kind: AttachmentKind;
  fileName: string;
  storageKey: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  notes: string | null;
  expenseId: string | null;
  projectId: string | null;
  projectIncomeId: string | null;
  projectStageId: string | null;
  clientId: string | null;
  budgetId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttachmentUploadTarget {
  entityType: AttachmentEntityType;
  entityId?: string;
  documentType?: DocumentPdfType;
  kind: AttachmentKind;
}

export interface AttachmentUploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
}

export interface AttachmentAccessResponse {
  url: string;
  expiresAt: string;
}
