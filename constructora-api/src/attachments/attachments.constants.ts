import { AttachmentKind, DocumentPdfType } from '@prisma/client';

export enum AttachmentEntityType {
  TENANT = 'TENANT',
  EXPENSE = 'EXPENSE',
  PROJECT = 'PROJECT',
  PROJECT_INCOME = 'PROJECT_INCOME',
  PROJECT_STAGE = 'PROJECT_STAGE',
  CLIENT = 'CLIENT',
  BUDGET = 'BUDGET',
  DOCUMENT_PDF_SETTING = 'DOCUMENT_PDF_SETTING',
}

type AttachmentPolicy = {
  allowedKinds: AttachmentKind[];
  maxSizeBytes: number;
  allowedMimeTypes: RegExp[];
};

const IMAGE_MIME_TYPES = [/^image\//i];
const RECEIPT_MIME_TYPES = [/^image\//i, /^application\/pdf$/i];
const DOCUMENT_MIME_TYPES = [
  /^application\/pdf$/i,
  /^image\//i,
  /^application\/msword$/i,
  /^application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document$/i,
  /^application\/vnd\.ms-excel$/i,
  /^application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet$/i,
  /^text\/plain$/i,
];

export const ATTACHMENT_ENTITY_POLICIES: Record<AttachmentEntityType, AttachmentPolicy> = {
  [AttachmentEntityType.TENANT]: {
    allowedKinds: [AttachmentKind.OTHER],
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
  },
  [AttachmentEntityType.EXPENSE]: {
    allowedKinds: [
      AttachmentKind.RECEIPT,
      AttachmentKind.PAYMENT_PROOF,
      AttachmentKind.INVOICE,
      AttachmentKind.OTHER,
    ],
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: RECEIPT_MIME_TYPES,
  },
  [AttachmentEntityType.PROJECT]: {
    allowedKinds: [
      AttachmentKind.PROGRESS_PHOTO,
      AttachmentKind.PLAN,
      AttachmentKind.CONTRACT,
      AttachmentKind.CLIENT_DOCUMENT,
      AttachmentKind.OTHER,
    ],
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
  },
  [AttachmentEntityType.PROJECT_INCOME]: {
    allowedKinds: [AttachmentKind.PAYMENT_PROOF, AttachmentKind.RECEIPT, AttachmentKind.OTHER],
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: RECEIPT_MIME_TYPES,
  },
  [AttachmentEntityType.PROJECT_STAGE]: {
    allowedKinds: [AttachmentKind.PROGRESS_PHOTO, AttachmentKind.PLAN, AttachmentKind.OTHER],
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
  },
  [AttachmentEntityType.CLIENT]: {
    allowedKinds: [AttachmentKind.CLIENT_DOCUMENT, AttachmentKind.CONTRACT, AttachmentKind.OTHER],
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
  },
  [AttachmentEntityType.BUDGET]: {
    allowedKinds: [AttachmentKind.SIGNED_BUDGET, AttachmentKind.PLAN, AttachmentKind.OTHER],
    maxSizeBytes: 20 * 1024 * 1024,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
  },
  [AttachmentEntityType.DOCUMENT_PDF_SETTING]: {
    allowedKinds: [AttachmentKind.OTHER],
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: IMAGE_MIME_TYPES,
  },
};

export const DOCUMENT_PDF_ATTACHMENT_TYPES = new Set<DocumentPdfType>([
  DocumentPdfType.BUDGET,
  DocumentPdfType.PROJECT_OPERATIONAL_REPORT,
  DocumentPdfType.PROJECT_EXECUTIVE_REPORT,
]);
