import { apiClient } from '@/lib/api-client';
import type {
  Attachment,
  AttachmentAccessResponse,
  AttachmentUploadTarget,
  AttachmentUploadUrlResponse
} from './types';

type AttachmentEntityQuery = {
  entityType: AttachmentUploadTarget['entityType'];
  entityId?: string;
  documentType?: AttachmentUploadTarget['documentType'];
};

type FinalizeAttachmentPayload = AttachmentUploadTarget & {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storageKey: string;
  notes?: string;
};

function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

export async function requestAttachmentUploadUrl(
  payload: AttachmentUploadTarget & { fileName: string; mimeType: string; fileSizeBytes: number }
): Promise<AttachmentUploadUrlResponse> {
  return apiClient<AttachmentUploadUrlResponse>('/attachments/upload-url', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function finalizeAttachmentUpload(
  payload: FinalizeAttachmentPayload
): Promise<Attachment> {
  return apiClient<Attachment>('/attachments/finalize', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function listAttachments(query: AttachmentEntityQuery): Promise<Attachment[]> {
  const params = new URLSearchParams({ entityType: query.entityType });
  if (query.entityId) {
    params.set('entityId', query.entityId);
  }
  if (query.documentType) {
    params.set('documentType', query.documentType);
  }

  return apiClient<Attachment[]>(`/attachments?${params.toString()}`);
}

export async function getAttachmentAccessUrl(
  attachmentId: string,
  download = false
): Promise<AttachmentAccessResponse> {
  const params = new URLSearchParams();
  if (download) {
    params.set('download', 'true');
  }

  const suffix = params.size ? `?${params.toString()}` : '';
  return apiClient<AttachmentAccessResponse>(`/attachments/${attachmentId}/access-url${suffix}`);
}

export async function deleteAttachment(attachmentId: string): Promise<{ success: true }> {
  return apiClient<{ success: true }>(`/attachments/${attachmentId}`, {
    method: 'DELETE'
  });
}

export async function uploadOptimizedImageAttachment(
  file: File,
  target: AttachmentUploadTarget,
  options?: { notes?: string }
): Promise<Attachment> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entityType', target.entityType);
  formData.append('kind', target.kind);

  if (target.entityId) {
    formData.append('entityId', target.entityId);
  }

  if (target.documentType) {
    formData.append('documentType', target.documentType);
  }

  if (options?.notes?.trim()) {
    formData.append('notes', options.notes.trim());
  }

  return apiClient<Attachment>('/attachments/image-upload', {
    method: 'POST',
    body: formData
  });
}

export async function uploadAttachment(
  file: File,
  target: AttachmentUploadTarget,
  options?: { notes?: string }
): Promise<Attachment> {
  if (isImageFile(file)) {
    return uploadOptimizedImageAttachment(file, target, options);
  }

  const uploadUrl = await requestAttachmentUploadUrl({
    ...target,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size
  });

  const uploadResponse = await fetch(uploadUrl.uploadUrl, {
    method: 'PUT',
    headers: uploadUrl.requiredHeaders,
    body: file
  });

  if (!uploadResponse.ok) {
    throw new Error('No se pudo subir el archivo al storage');
  }

  return finalizeAttachmentUpload({
    ...target,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSizeBytes: file.size,
    storageKey: uploadUrl.storageKey,
    notes: options?.notes
  });
}
