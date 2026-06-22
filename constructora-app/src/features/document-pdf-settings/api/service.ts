import { apiClient } from '@/lib/api-client';
import type {
  DocumentPdfSetting,
  DocumentPdfType,
  UpdateDocumentPdfSettingPayload,
} from './types';

export async function getDocumentPdfSetting(documentType: DocumentPdfType): Promise<DocumentPdfSetting> {
  return apiClient<DocumentPdfSetting>(`/document-pdf-settings/${documentType}`);
}

export async function updateDocumentPdfSetting(
  documentType: DocumentPdfType,
  data: UpdateDocumentPdfSettingPayload,
): Promise<DocumentPdfSetting> {
  return apiClient<DocumentPdfSetting>(`/document-pdf-settings/${documentType}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
