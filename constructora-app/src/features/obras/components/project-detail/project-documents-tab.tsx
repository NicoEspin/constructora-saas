'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileUploader } from '@/components/file-uploader';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  deleteAttachment,
  getAttachmentAccessUrl,
  listAttachments,
  uploadAttachment
} from '@/features/attachments/api/service';
import { AttachmentList } from '@/features/attachments/components/attachment-list';
import type { Attachment, AttachmentKind } from '@/features/attachments/api/types';

const DOCUMENT_KIND_OPTIONS: Array<{ value: AttachmentKind; label: string }> = [
  { value: 'PLAN', label: 'Plano' },
  { value: 'CONTRACT', label: 'Contrato' },
  { value: 'CLIENT_DOCUMENT', label: 'Documento del cliente' },
  { value: 'OTHER', label: 'Otro documento' }
];

const DOCUMENT_ACCEPT = {
  'application/pdf': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
  'application/vnd.ms-excel': [],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
  'image/*': [],
  'text/plain': []
} as const;

interface ProjectDocumentsTabProps {
  projectId: string;
}

async function openAttachment(attachment: Attachment, download?: boolean) {
  const access = await getAttachmentAccessUrl(attachment.id, download);
  window.open(access.url, '_blank', 'noopener,noreferrer');
}

export function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentKind, setDocumentKind] = useState<AttachmentKind>('PLAN');
  const [photoTitle, setPhotoTitle] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');

  const attachmentsQuery = useQuery({
    queryKey: ['attachments', 'project', projectId],
    queryFn: () => listAttachments({ entityType: 'PROJECT', entityId: projectId })
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: async () => {
      if (photoFiles.length === 0) {
        return;
      }

      await Promise.all(
        photoFiles.map((file) =>
          uploadAttachment(
            file,
            {
              entityType: 'PROJECT',
              entityId: projectId,
              kind: 'PROGRESS_PHOTO'
            },
            {
              notes: photoTitle.trim() || undefined
            }
          )
        )
      );
    },
    onSuccess: async () => {
      setPhotoFiles([]);
      setPhotoTitle('');
      await attachmentsQuery.refetch();
      toast.success('Fotos de avance subidas');
    },
    onError: () => toast.error('No se pudieron subir las fotos')
  });

  const uploadDocumentsMutation = useMutation({
    mutationFn: async () => {
      if (documentFiles.length === 0) {
        return;
      }

      await Promise.all(
        documentFiles.map((file) =>
          uploadAttachment(
            file,
            {
              entityType: 'PROJECT',
              entityId: projectId,
              kind: documentKind
            },
            {
              notes: documentTitle.trim() || undefined
            }
          )
        )
      );
    },
    onSuccess: async () => {
      setDocumentFiles([]);
      setDocumentTitle('');
      await attachmentsQuery.refetch();
      toast.success('Documentos subidos');
    },
    onError: () => toast.error('No se pudieron subir los documentos')
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: async () => {
      await attachmentsQuery.refetch();
      toast.success('Adjunto eliminado');
    },
    onError: () => toast.error('No se pudo eliminar el adjunto')
  });

  const attachments = attachmentsQuery.data ?? [];
  const progressPhotos = attachments.filter((attachment) => attachment.kind === 'PROGRESS_PHOTO');
  const documents = attachments.filter((attachment) => attachment.kind !== 'PROGRESS_PHOTO');

  return (
    <div className='flex flex-col gap-4'>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Fotos de avance</CardTitle>
            <CardDescription>
              Cargá evidencia visual privada de la obra con vista previa y fecha de carga.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='project-photo-title'>Nombre visible</FieldLabel>
                <Input
                  id='project-photo-title'
                  value={photoTitle}
                  onChange={(event) => setPhotoTitle(event.target.value)}
                  placeholder='Ej.: Frente de obra - semana 3'
                />
                <FieldDescription>
                  Opcional. Si seleccionás varios archivos, se aplica el mismo nombre visible a
                  todos.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Nuevas fotos</FieldLabel>
                <FileUploader
                  value={photoFiles}
                  onValueChange={setPhotoFiles}
                  accept={{ 'image/*': [] }}
                  maxFiles={10}
                  maxSize={15 * 1024 * 1024}
                  multiple
                />
                <FieldDescription>Hasta 10 fotos por tanda y 15 MB por archivo.</FieldDescription>
              </Field>

              <Button
                type='button'
                onClick={() => uploadPhotosMutation.mutate()}
                disabled={photoFiles.length === 0}
                isLoading={uploadPhotosMutation.isPending}
              >
                <Icons.upload data-icon='inline-start' />
                Subir fotos
              </Button>

              <AttachmentList
                attachments={progressPhotos}
                emptyLabel='Todavía no hay fotos de avance cargadas'
                deletingId={deleteAttachmentMutation.variables ?? null}
                onOpen={openAttachment}
                onDelete={async (attachment) => {
                  await deleteAttachmentMutation.mutateAsync(attachment.id);
                }}
                showPreview
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Documentos de obra</CardTitle>
            <CardDescription>
              Planos, contratos, imágenes y archivos privados vinculados a la obra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Tipo de documento</FieldLabel>
                <Select
                  value={documentKind}
                  onValueChange={(value) => setDocumentKind(value as AttachmentKind)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Seleccioná un tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_KIND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor='project-document-title'>Nombre visible</FieldLabel>
                <Input
                  id='project-document-title'
                  value={documentTitle}
                  onChange={(event) => setDocumentTitle(event.target.value)}
                  placeholder='Ej.: Contrato firmado - proveedor'
                />
                <FieldDescription>
                  Opcional. Si no completás nada, se muestra el nombre original del archivo.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Nuevos documentos</FieldLabel>
                <FileUploader
                  value={documentFiles}
                  onValueChange={setDocumentFiles}
                  accept={DOCUMENT_ACCEPT}
                  maxFiles={10}
                  maxSize={20 * 1024 * 1024}
                  multiple
                />
                <FieldDescription>
                  PDF, imágenes, Office o texto plano. Hasta 20 MB por archivo.
                </FieldDescription>
              </Field>

              <Button
                type='button'
                onClick={() => uploadDocumentsMutation.mutate()}
                disabled={documentFiles.length === 0}
                isLoading={uploadDocumentsMutation.isPending}
              >
                <Icons.upload data-icon='inline-start' />
                Subir documentos
              </Button>

              <AttachmentList
                attachments={documents}
                emptyLabel='Todavía no hay documentos cargados'
                deletingId={deleteAttachmentMutation.variables ?? null}
                onOpen={openAttachment}
                onDelete={async (attachment) => {
                  await deleteAttachmentMutation.mutateAsync(attachment.id);
                }}
                showPreview
              />
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
