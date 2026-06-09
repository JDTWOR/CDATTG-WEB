import type { RouteObject } from 'react-router-dom';
import { administracionPaths } from '../paths';

export const administracionRoutes: RouteObject[] = [
  {
    path: administracionPaths.jornadas,
    handle: { breadcrumb: { label: 'Jornadas de formación' } },
    lazy: async () => {
      const { AdministracionJornadasPage } = await import('../../pages/administracion/AdministracionJornadasPage');
      return { Component: AdministracionJornadasPage };
    },
  },
];
