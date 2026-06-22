'use client';

import { useQuery } from '@tanstack/react-query';
import { getAttachmentAccessUrl } from '../api/service';

export function useAttachmentAccessUrl(attachmentId: string | null | undefined) {
  const query = useQuery({
    queryKey: ['attachments', 'access-url', attachmentId],
    queryFn: async () => {
      const result = await getAttachmentAccessUrl(attachmentId!);
      return result.url;
    },
    enabled: Boolean(attachmentId),
  });

  return {
    ...query,
    url: query.data ?? null,
  };
}
