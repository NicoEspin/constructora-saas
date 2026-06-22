export type DocumentPdfType =
  | 'BUDGET'
  | 'PROJECT_OPERATIONAL_REPORT'
  | 'PROJECT_EXECUTIVE_REPORT';
export type DocumentPdfLayout = 'CLASSIC' | 'ACCENT' | 'COMPACT';
export type DocumentPdfLogoSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface DocumentPdfSetting {
  id: string | null;
  tenantId: string;
  documentType: DocumentPdfType;
  layout: DocumentPdfLayout;
  primaryColor: string;
  logoAttachmentId: string | null;
  logoSize: DocumentPdfLogoSize;
   tenantLogoAttachmentId: string | null;
   effectiveLogoAttachmentId: string | null;
   effectiveLogoSource: 'DOCUMENT' | 'TENANT' | 'NONE';
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateDocumentPdfSettingPayload {
  layout: DocumentPdfLayout;
  primaryColor: string;
  logoAttachmentId?: string | null;
  logoSize: DocumentPdfLogoSize;
}
