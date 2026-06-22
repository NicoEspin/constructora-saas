import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { updateDocumentPdfSetting } from './service';
import { documentPdfSettingKeys } from './queries';
import type { DocumentPdfSetting, DocumentPdfType, UpdateDocumentPdfSettingPayload } from './types';

export const updateDocumentPdfSettingMutation = mutationOptions({
  mutationFn: ({
    documentType,
    data,
  }: {
    documentType: DocumentPdfType;
    data: UpdateDocumentPdfSettingPayload;
  }) => updateDocumentPdfSetting(documentType, data),
  onSuccess: (updated: DocumentPdfSetting) => {
    getQueryClient().setQueryData(documentPdfSettingKeys.detail(updated.documentType), updated);
  },
});
