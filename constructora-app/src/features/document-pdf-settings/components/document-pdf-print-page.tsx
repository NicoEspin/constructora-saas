'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAttachmentAccessUrl } from '@/features/attachments/hooks/use-attachment-access-url';
import { BudgetPrintActions } from '@/features/presupuestos/components/budget-print-actions';
import { documentPdfSettingQueryOptions } from '../api/queries';
import type { DocumentPdfSetting, DocumentPdfType } from '../api/types';
import { downloadElementAsPdf } from '../lib/download-budget-pdf';

type DocumentPdfPrintPageProps = {
  documentType: DocumentPdfType;
  initialSetting: DocumentPdfSetting;
  fileName: string;
  renderDocument: (args: { setting: DocumentPdfSetting; logoUrl: string | null }) => ReactNode;
};

type PdfCaptureStyle = CSSProperties & Record<`--${string}`, string>;

const PDF_CAPTURE_COLOR_VARS: PdfCaptureStyle = {
  '--color-white': '#FFFFFF',
  '--color-black': '#000000',
  '--color-neutral-100': '#F5F5F5',
  '--color-neutral-200': '#E5E5E5',
  '--color-neutral-500': '#737373',
  '--color-neutral-600': '#525252',
  '--color-neutral-700': '#404040',
  '--color-neutral-900': '#171717',
};

export function DocumentPdfPrintPage({
  documentType,
  initialSetting,
  fileName,
  renderDocument,
}: DocumentPdfPrintPageProps) {
  const documentRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: setting } = useQuery({
    ...documentPdfSettingQueryOptions(documentType),
    initialData: initialSetting,
  });
  const logoQuery = useAttachmentAccessUrl(setting.effectiveLogoAttachmentId);
  const isDocumentReady = !setting.effectiveLogoAttachmentId || Boolean(logoQuery.url);

  async function handleDownload() {
    if (!documentRef.current || isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      await downloadElementAsPdf(documentRef.current, fileName);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className='mx-auto flex min-h-screen max-w-6xl flex-col gap-6 bg-white px-6 py-8 text-black'>
      <div className='flex justify-end'>
        <BudgetPrintActions
          onDownload={handleDownload}
          isDownloading={isDownloading}
          isDisabled={!isDocumentReady}
        />
      </div>
      <div ref={documentRef} style={PDF_CAPTURE_COLOR_VARS}>
        {renderDocument({ setting, logoUrl: logoQuery.url })}
      </div>
    </main>
  );
}
