import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: [],
      },
      {
        title: 'Reportes',
        url: '/dashboard/reportes',
        icon: 'post',
        isActive: false,
        items: [],
      },
    ],
  },
  {
    label: 'Obras',
    items: [
      {
        title: 'Obras',
        url: '/dashboard/obras',
        icon: 'obras',
        isActive: false,
        items: [],
      },
      {
        title: 'Presupuestos',
        url: '/dashboard/presupuestos',
        icon: 'billing',
        isActive: false,
        items: [],
      },
      {
        title: 'Gastos',
        url: '/dashboard/gastos',
        icon: 'gastos',
        isActive: false,
        items: [],
      },
      {
        title: 'Plantillas',
        url: '/dashboard/plantillas',
        icon: 'galleryVerticalEnd',
        isActive: false,
        items: [],
      },
    ],
  },
  {
    label: 'Directorio',
    items: [
      {
        title: 'Clientes',
        url: '/dashboard/clientes',
        icon: 'teams',
        isActive: false,
        items: [],
      },
      {
        title: 'Proveedores',
        url: '/dashboard/proveedores',
        icon: 'teams',
        isActive: false,
        items: [],
      },
      {
        title: 'Materiales',
        url: '/dashboard/materiales',
        icon: 'palette',
        isActive: false,
        items: [],
      },
    ],
  },
  {
    label: 'Gestión',
    items: [
      {
        title: 'Usuarios',
        url: '/dashboard/usuarios',
        icon: 'account',
        isActive: false,
        items: [],
      },
      {
        title: 'Configuración',
        url: '/dashboard/configuracion',
        icon: 'notification',
        isActive: false,
        items: [],
      },
    ],
  },
];
