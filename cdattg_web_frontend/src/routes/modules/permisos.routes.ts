import type { RouteObject } from 'react-router-dom';
import { permisosPaths } from '../paths';

export const permisosRoutes: RouteObject[] = [
  {
    path: permisosPaths.index,
    handle: { breadcrumb: { label: 'Permisos y roles' } },
    lazy: async () => {
      const { Permisos } = await import('../../pages/Permisos');
      return { Component: Permisos };
    },
  },
  {
    path: '/permisos/:userId',
    handle: {
      breadcrumb: (params: Record<string, string | undefined>) => [
        { label: 'Permisos y roles', to: permisosPaths.index },
        { label: params.userId ? `Usuario ${params.userId}` : 'Usuario' },
      ],
    },
    lazy: async () => {
      const { Permisos } = await import('../../pages/Permisos');
      return { Component: Permisos };
    },
  },
];
