'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getQueryClient } from '@/lib/query-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { FileUploader } from '@/components/file-uploader';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Icons } from '@/components/icons';
import { useAppForm } from '@/components/ui/tanstack-form';
import { AttachmentList } from '@/features/attachments/components/attachment-list';
import { useAttachmentAccessUrl } from '@/features/attachments/hooks/use-attachment-access-url';
import {
  deleteAttachment,
  getAttachmentAccessUrl,
  listAttachments,
  uploadAttachment,
} from '@/features/attachments/api/service';
import { documentPdfSettingKeys, documentPdfSettingQueryOptions } from '../api/queries';
import { updateDocumentPdfSettingMutation } from '../api/mutations';
import type { DocumentPdfSetting, DocumentPdfType } from '../api/types';
import {
  DOCUMENT_PDF_LAYOUT_DESCRIPTIONS,
  DOCUMENT_PDF_LAYOUT_LABELS,
  DOCUMENT_PDF_LOGO_SIZE_LABELS,
  documentPdfSettingSchema,
  type DocumentPdfSettingFormValues,
} from '../schemas/document-pdf-setting';

type DocumentPdfSettingsSectionProps = {
  initialSetting: DocumentPdfSetting;
  documentType: DocumentPdfType;
  title: string;
  description: string;
  logoLabel: string;
  logoDescription: string;
  successMessage: string;
  errorMessage: string;
  tenantName: string;
  renderPreview: (args: {
    tenantName: string;
    setting: DocumentPdfSetting;
    logoUrl: string | null;
  }) => ReactNode;
};

function isValidHexColor(value: string) {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

function toFormValues(setting: DocumentPdfSetting): DocumentPdfSettingFormValues {
  return {
    layout: setting.layout,
    primaryColor: setting.primaryColor,
    logoSize: setting.logoSize,
  };
}

export function DocumentPdfSettingsSection({
  initialSetting,
  documentType,
  title,
  description,
  logoLabel,
  logoDescription,
  successMessage,
  errorMessage,
  tenantName,
  renderPreview,
}: DocumentPdfSettingsSectionProps) {
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [localLogoPreviewUrl, setLocalLogoPreviewUrl] = useState<string | null>(null);
  const settingQuery = useQuery({
    ...documentPdfSettingQueryOptions(documentType),
    initialData: initialSetting,
  });
  const effectiveLogoQuery = useAttachmentAccessUrl(settingQuery.data.effectiveLogoAttachmentId);
  const logoAttachmentsQuery = useQuery({
    queryKey: ['attachments', 'document-pdf-setting', documentType],
    queryFn: () => listAttachments({ entityType: 'DOCUMENT_PDF_SETTING', documentType }),
  });

  const saveMutation = useMutation({
    ...updateDocumentPdfSettingMutation,
    onSuccess: (updated) => {
      getQueryClient().setQueryData(documentPdfSettingKeys.detail(updated.documentType), updated);
      toast.success(successMessage);
      form.reset(toFormValues(updated));
      setLogoFiles([]);
      void logoAttachmentsQuery.refetch();
    },
    onError: () => toast.error(errorMessage),
  });
  const deleteLogoMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: async () => {
      toast.success('Logo eliminado');
      setLocalLogoPreviewUrl(null);
      await Promise.all([settingQuery.refetch(), logoAttachmentsQuery.refetch()]);
    },
    onError: () => toast.error('No se pudo eliminar el logo'),
  });

  const form = useAppForm({
    defaultValues: toFormValues(initialSetting),
    validators: { onSubmit: documentPdfSettingSchema },
    onSubmit: async ({ value }) => {
      let logoAttachmentId = settingQuery.data.logoAttachmentId;

      if (logoFiles[0]) {
        try {
          const uploadedLogo = await uploadAttachment(logoFiles[0], {
            entityType: 'DOCUMENT_PDF_SETTING',
            documentType,
            kind: 'OTHER',
          });
          logoAttachmentId = uploadedLogo.id;
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'No se pudo subir el logo');
          return;
        }
      }

      await saveMutation.mutateAsync({
        documentType,
        data: {
          ...value,
          logoAttachmentId,
        },
      });
    },
  });

  useEffect(() => {
    form.reset(toFormValues(settingQuery.data));
  }, [form, settingQuery.data]);

  useEffect(() => {
    if (!logoFiles[0]) {
      setLocalLogoPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(logoFiles[0]);
    setLocalLogoPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [logoFiles]);

  const values = useStore(form.store, (state) => state.values);
  const previewLogoUrl = localLogoPreviewUrl ?? effectiveLogoQuery.url;
  const previewSetting: DocumentPdfSetting = {
    ...settingQuery.data,
    layout: values.layout,
    primaryColor: values.primaryColor,
    logoSize: values.logoSize,
  };

  return (
    <div className='grid gap-6 xl:grid-cols-[360px_1fr]'>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form.AppForm>
            <form.Form className='p-0 md:p-0'>
              <FieldGroup>
                <form.AppField name='layout'>
                  {(field) => (
                    <Field>
                      <FieldLabel>Layout</FieldLabel>
                      <ToggleGroup
                        type='single'
                        variant='outline'
                        value={String(field.state.value)}
                        onValueChange={(value) => {
                          if (!value) {
                            return;
                          }

                          field.handleChange(value as DocumentPdfSettingFormValues['layout']);
                        }}
                        className='w-full'
                      >
                        {Object.entries(DOCUMENT_PDF_LAYOUT_LABELS).map(([value, label]) => (
                          <ToggleGroupItem key={value} value={value} className='flex-1'>
                            {label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      <FieldDescription>
                        {DOCUMENT_PDF_LAYOUT_DESCRIPTIONS[field.state.value]}
                      </FieldDescription>
                    </Field>
                  )}
                </form.AppField>

                <form.AppField name='primaryColor'>
                  {(field) => {
                    const hasError = field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={hasError}>
                        <FieldLabel>Color principal</FieldLabel>
                        <div className='grid gap-3 sm:grid-cols-[72px_1fr]'>
                          <Input
                            type='color'
                            value={
                              isValidHexColor(String(field.state.value))
                                ? String(field.state.value)
                                : '#1D4ED8'
                            }
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value.toUpperCase())
                            }
                            aria-invalid={hasError || undefined}
                            className='h-11 w-full p-1'
                          />
                          <Input
                            value={String(field.state.value)}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value.toUpperCase())
                            }
                            aria-invalid={hasError || undefined}
                            placeholder='#1D4ED8'
                          />
                        </div>
                        <FieldDescription>
                          Se aplica a cabecera, métricas destacadas y bloques de resumen del PDF.
                        </FieldDescription>
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    );
                  }}
                </form.AppField>

                <Field>
                  <FieldLabel>{logoLabel}</FieldLabel>
                  <FileUploader
                    value={logoFiles}
                    onValueChange={setLogoFiles}
                    accept={{ 'image/*': [] }}
                    maxFiles={1}
                    maxSize={10 * 1024 * 1024}
                  />
                  <FieldDescription>{logoDescription}</FieldDescription>
                </Field>

                <form.AppField name='logoSize'>
                  {(field) => (
                    <Field>
                      <FieldLabel>Tamaño del logo</FieldLabel>
                      <ToggleGroup
                        type='single'
                        variant='outline'
                        value={String(field.state.value)}
                        onValueChange={(value) => {
                          if (!value) {
                            return;
                          }

                          field.handleChange(value as DocumentPdfSettingFormValues['logoSize']);
                        }}
                        className='w-full'
                      >
                        {Object.entries(DOCUMENT_PDF_LOGO_SIZE_LABELS).map(([value, label]) => (
                          <ToggleGroupItem key={value} value={value} className='flex-1'>
                            {label}
                          </ToggleGroupItem>
                        ))}
                      </ToggleGroup>
                      <FieldDescription>
                        Controla qué tan grande se ve el logo en la cabecera del PDF.
                      </FieldDescription>
                    </Field>
                  )}
                </form.AppField>

                {previewLogoUrl ? (
                  <div className='flex items-center justify-between gap-3 rounded-lg border p-3'>
                    <div>
                      <p className='text-sm font-medium'>Logo efectivo actual</p>
                      <p className='text-xs text-muted-foreground'>
                        {settingQuery.data.effectiveLogoSource === 'DOCUMENT'
                          ? 'Estás usando un logo propio para este documento.'
                          : settingQuery.data.effectiveLogoSource === 'TENANT'
                            ? 'No hay logo propio: se usa el logo institucional del tenant.'
                            : 'Vista privada con URL firmada temporal.'}
                      </p>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => window.open(previewLogoUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <Icons.externalLink className='mr-2 h-4 w-4' />
                      Ver logo
                    </Button>
                  </div>
                ) : null}

                <AttachmentList
                  attachments={logoAttachmentsQuery.data ?? []}
                  emptyLabel='Todavia no hay logos cargados'
                  deletingId={deleteLogoMutation.variables ?? null}
                  onOpen={async (attachment, download) => {
                    const access = await getAttachmentAccessUrl(attachment.id, download);
                    window.open(access.url, '_blank', 'noopener,noreferrer');
                  }}
                  onDelete={async (attachment) => {
                    await deleteLogoMutation.mutateAsync(attachment.id);
                  }}
                />

                <Alert>
                  <Icons.info className='h-4 w-4' />
                  <AlertTitle>Objetos privados</AlertTitle>
                  <AlertDescription>
                    Los logos no quedan publicos en R2. La app pide una URL firmada corta solo
                    cuando hace falta verlos o descargarlos.
                  </AlertDescription>
                </Alert>

                <Button type='submit' disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                  ) : null}
                  Guardar plantilla
                </Button>
              </FieldGroup>
            </form.Form>
          </form.AppForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
          <CardDescription>
            Esta muestra usa el logo efectivo del tenant y los cambios del formulario en tiempo
            real.
          </CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          {renderPreview({
            tenantName,
            setting: previewSetting,
            logoUrl: previewLogoUrl,
          })}
        </CardContent>
      </Card>
    </div>
  );
}
