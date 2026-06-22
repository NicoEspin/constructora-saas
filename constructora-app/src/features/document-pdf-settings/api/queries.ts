import { queryOptions } from '@tanstack/react-query';
import { getDocumentPdfSetting } from './service';
import type { DocumentPdfType } from './types';

export const documentPdfSettingKeys = {
  all: ['document-pdf-settings'] as const,
  detail: (documentType: DocumentPdfType) =>
    [...documentPdfSettingKeys.all, 'detail', documentType] as const,
};

export const documentPdfSettingQueryOptions = (documentType: DocumentPdfType) =>
  queryOptions({
    queryKey: documentPdfSettingKeys.detail(documentType),
    queryFn: () => getDocumentPdfSetting(documentType),
  });
