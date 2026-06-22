'use client';

import { useQueries } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { getAttachmentAccessUrl } from '../api/service';
import type { Attachment } from '../api/types';

type AttachmentListProps = {
  attachments: Attachment[];
  onOpen: (attachment: Attachment, download?: boolean) => void | Promise<void>;
  onDelete?: (attachment: Attachment) => void | Promise<void>;
  deletingId?: string | null;
  emptyLabel?: string;
  showPreview?: boolean;
};

function formatSize(bytes: number | null) {
  if (!bytes) {
    return 'Tamaño desconocido';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAttachmentDate(value: string) {
  return format(new Date(value), 'dd MMM yyyy', { locale: es });
}

function isImageAttachment(attachment: Attachment) {
  return attachment.mimeType?.startsWith('image/') ?? false;
}

function getVisibleName(attachment: Attachment) {
  return attachment.notes?.trim() || attachment.fileName;
}

function getFileIcon(attachment: Attachment) {
  if (attachment.mimeType === 'application/pdf') {
    return Icons.fileTypePdf;
  }

  if (
    attachment.mimeType === 'application/msword' ||
    attachment.mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return Icons.fileTypeDoc;
  }

  if (
    attachment.mimeType === 'application/vnd.ms-excel' ||
    attachment.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    return Icons.fileTypeXls;
  }

  return Icons.page;
}

export function AttachmentList({
  attachments,
  onOpen,
  onDelete,
  deletingId = null,
  emptyLabel = 'Sin adjuntos',
  showPreview = false
}: AttachmentListProps) {
  const imageAttachments = showPreview ? attachments.filter(isImageAttachment) : [];
  const previewQueries = useQueries({
    queries: imageAttachments.map((attachment) => ({
      queryKey: ['attachment-preview', attachment.id],
      queryFn: async () => {
        const result = await getAttachmentAccessUrl(attachment.id);
        return result.url;
      },
      staleTime: 240_000
    }))
  });
  const previewUrlById = new Map(
    imageAttachments.map((attachment, index) => [
      attachment.id,
      previewQueries[index]?.data ?? null
    ])
  );

  if (attachments.length === 0) {
    return <p className='text-sm text-muted-foreground'>{emptyLabel}</p>;
  }

  return (
    <div className='flex flex-col gap-3'>
      {attachments.map((attachment) => {
        const visibleName = getVisibleName(attachment);
        const hasCustomTitle = Boolean(attachment.notes?.trim());
        const isImage = showPreview && isImageAttachment(attachment);
        const previewUrl = isImage ? previewUrlById.get(attachment.id) : null;
        const FileIcon = getFileIcon(attachment);

        return (
          <div key={attachment.id} className='flex gap-3 rounded-xl border p-3'>
            {isImage ? (
              previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={visibleName}
                  width={80}
                  height={80}
                  unoptimized
                  sizes='80px'
                  className='size-20 rounded-lg border object-cover'
                />
              ) : (
                <div className='bg-muted text-muted-foreground flex size-20 items-center justify-center rounded-lg border'>
                  <Icons.media />
                </div>
              )
            ) : (
              <div className='bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-lg border'>
                <FileIcon />
              </div>
            )}

            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{visibleName}</p>
              {hasCustomTitle ? (
                <p className='truncate text-xs text-muted-foreground'>{attachment.fileName}</p>
              ) : null}
              <p className='text-xs text-muted-foreground'>
                {formatAttachmentDate(attachment.createdAt)} ·{' '}
                {formatSize(attachment.fileSizeBytes)}
              </p>
            </div>

            <div className='flex items-start gap-1'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => void onOpen(attachment)}
              >
                <Icons.externalLink />
                <span className='sr-only'>Ver adjunto</span>
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => void onOpen(attachment, true)}
              >
                <Icons.download />
                <span className='sr-only'>Descargar adjunto</span>
              </Button>
              {onDelete ? (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => void onDelete(attachment)}
                  disabled={deletingId === attachment.id}
                >
                  <Icons.trash />
                  <span className='sr-only'>Eliminar adjunto</span>
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
