'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { currentTenantQueryOptions } from '@/features/tenants/api/queries';
import { useAttachmentAccessUrl } from '@/features/attachments/hooks/use-attachment-access-url';
import { Icons } from './icons';

export function TenantSwitcher() {
  const { isMobile } = useSidebar();
  const { activeTenantId, isLoaded } = useAuth();
  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    ...currentTenantQueryOptions(),
    enabled: isLoaded && !!activeTenantId,
  });
  const logoQuery = useAttachmentAccessUrl(tenant?.logoAttachmentId);

  if (!isLoaded || (!!activeTenantId && isTenantLoading)) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg'>
              <Icons.galleryVerticalEnd className='size-4' />
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>Cargando...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const tenantName = tenant?.name ?? 'Mi constructora';
  const tenantInitials = tenantName.slice(0, 2).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='size-8 rounded-lg'>
                {logoQuery.url ? <AvatarImage src={logoQuery.url} alt={tenantName} className='object-contain' /> : null}
                <AvatarFallback className='bg-sidebar-primary text-sidebar-primary-foreground rounded-lg text-xs'>
                  {tenantInitials}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{tenantName}</span>
                <span className='text-muted-foreground truncate text-xs'>
                  {tenant?.slug ?? 'Sin tenant'}
                </span>
              </div>
              <Icons.chevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Empresa activa
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className='px-2 py-1.5 text-sm'>{tenantName}</div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
