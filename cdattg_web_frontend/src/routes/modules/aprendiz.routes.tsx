import type { RouteObject } from 'react-router-dom';
import { aprendizPaths } from '../paths';

export const aprendizRoutes: RouteObject[] = [
  {
    path: aprendizPaths.misInasistencias,
    handle: { breadcrumb: { label: 'Mis inasistencias' } },
    lazy: async () => {
      const { MisInasistenciasPage } = await import('../../pages/aprendiz/MisInasistenciasPage');
      return { Component: MisInasistenciasPage };
    },
  },
];
