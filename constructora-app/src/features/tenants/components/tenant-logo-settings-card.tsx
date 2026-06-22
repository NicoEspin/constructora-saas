'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileUploader } from '@/components/file-uploader';
import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { getQueryClient } from '@/lib/query-client';
import { uploadAttachment } from '@/features/attachments/api/service';
import { useAttachmentAccessUrl } from '@/features/attachments/hooks/use-attachment-access-url';
import { documentPdfSettingKeys } from '@/features/document-pdf-settings/api/queries';
import { currentTenantQueryOptions, tenantKeys } from '../api/queries';
import { updateCurrentTenant } from '../api/service';
import type { Tenant } from '../api/types';

type TenantLogoSettingsCardProps = {
  initialTenant: Tenant;
};

type SaveLogoInput = { files: File[] } | { removeLogo: true };

export function TenantLogoSettingsCard({ initialTenant }: TenantLogoSettingsCardProps) {
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const tenantQuery = useQuery({
    ...currentTenantQueryOptions(),
    initialData: initialTenant,
  });
  const currentLogoQuery = useAttachmentAccessUrl(tenantQuery.data.logoAttachmentId);

  const saveMutation = useMutation({
    mutationFn: async (input: SaveLogoInput) => {
      if ('removeLogo' in input) {
        return updateCurrentTenant({ logoAttachmentId: null });
      }

      let logoAttachmentId = tenantQuery.data.logoAttachmentId;

      if (input.files[0]) {
        const uploadedLogo = await uploadAttachment(input.files[0], {
          entityType: 'TENANT',
          entityId: tenantQuery.data.id,
          kind: 'OTHER',
        });
        logoAttachmentId = uploadedLogo.id;
      }

      return updateCurrentTenant({ logoAttachmentId });
    },
    onSuccess: (tenant) => {
      getQueryClient().setQueryData(tenantKeys.current(), tenant);
      getQueryClient().invalidateQueries({ queryKey: documentPdfSettingKeys.all });
      setLogoFiles([]);
      toast.success('Logo del tenant actualizado');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el logo del tenant');
    },
  });

  useEffect(() => {
    if (!logoFiles[0]) {
      setLocalPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(logoFiles[0]);
    setLocalPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [logoFiles]);

  const previewUrl = localPreviewUrl ?? currentLogoQuery.url;

  async function handleSave() {
    try {
      await saveMutation.mutateAsync({ files: logoFiles });
    } catch {
      // onError already surfaces a toast
    }
  }

  async function handleRemove() {
    if (!tenantQuery.data.logoAttachmentId) {
      setLogoFiles([]);
      return;
    }

    try {
      await saveMutation.mutateAsync({ removeLogo: true });
    } catch {
      // onError already surfaces a toast
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo del tenant</CardTitle>
        <CardDescription>
          Este logo queda disponible como imagen institucional por defecto para tus documentos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col gap-6'>
          <FieldGroup>
            <Field>
              <FieldLabel>Imagen institucional</FieldLabel>
              <FileUploader
                value={logoFiles}
                onValueChange={setLogoFiles}
                accept={{ 'image/*': [] }}
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
              />
              <FieldDescription>
                Se guarda como attachment privado del tenant y se reutiliza como fallback en PDFs.
              </FieldDescription>
            </Field>
          </FieldGroup>

          {previewUrl ? (
            <div className='flex items-center justify-between gap-4 rounded-lg border p-4'>
              <div className='flex flex-col gap-1'>
                <p className='text-sm font-medium'>Preview actual</p>
                <p className='text-xs text-muted-foreground'>Se va a usar como imagen institucional por defecto.</p>
              </div>
              {/* oxlint-disable-next-line next/no-img-element */}
              <img
                src={previewUrl}
                alt='Logo del tenant'
                className='max-h-16 max-w-40 rounded-md object-contain'
                crossOrigin='anonymous'
              />
            </div>
          ) : (
            <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
              Todavía no cargaste un logo institucional.
            </div>
          )}

          <Alert>
            <Icons.info className='h-4 w-4' />
            <AlertTitle>Fallback compartido</AlertTitle>
            <AlertDescription>
              Si un presupuesto no define su propio logo, usa este. Si tampoco existe, no se muestra nada.
            </AlertDescription>
          </Alert>

          <div className='flex flex-wrap gap-3'>
            <Button type='button' onClick={handleSave} isLoading={saveMutation.isPending}>
              Guardar logo
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={handleRemove}
              disabled={saveMutation.isPending || !tenantQuery.data.logoAttachmentId}
            >
              Quitar logo
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
