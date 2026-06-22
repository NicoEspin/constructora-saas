'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';

type BreadcrumbItem = {
  title: string;
  link: string;
};

type BreadcrumbTitleState = {
  path: string | null;
  title: string | null;
  set: (path: string, title: string) => void;
  clear: (path: string) => void;
};

// Lets a dynamic detail page (e.g. /dashboard/obras/[id]) override the last
// breadcrumb segment with real data instead of the raw route param.
const useBreadcrumbTitleStore = create<BreadcrumbTitleState>((set, get) => ({
  path: null,
  title: null,
  set: (path, title) => set({ path, title }),
  clear: (path) => {
    if (get().path === path) set({ path: null, title: null });
  },
}));

export function useSetBreadcrumbTitle(title: string | undefined) {
  const pathname = usePathname();
  const setTitle = useBreadcrumbTitleStore((state) => state.set);
  const clearTitle = useBreadcrumbTitleStore((state) => state.clear);

  useEffect(() => {
    if (!title) return;
    setTitle(pathname, title);
    return () => clearTitle(pathname);
  }, [pathname, title, setTitle, clearTitle]);
}

// This allows to add custom title as well
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/employee': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Employee', link: '/dashboard/employee' }
  ],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Product', link: '/dashboard/product' }
  ],
  '/dashboard/configuracion': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Configuración', link: '/dashboard/configuracion' }
  ],
  '/dashboard/configuracion/estilos-pdf': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Configuración', link: '/dashboard/configuracion' },
    { title: 'Estilos de PDF', link: '/dashboard/configuracion/estilos-pdf' }
  ]
  // Add more custom mappings as needed
};

export function useBreadcrumbs() {
  const pathname = usePathname();
  const overridePath = useBreadcrumbTitleStore((state) => state.path);
  const overrideTitle = useBreadcrumbTitleStore((state) => state.title);

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    const items = segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });

    if (overridePath === pathname && overrideTitle && items.length > 0) {
      items[items.length - 1] = { ...items[items.length - 1], title: overrideTitle };
    }

    return items;
  }, [pathname, overridePath, overrideTitle]);

  return breadcrumbs;
}
