import type { RouteObject } from 'react-router-dom';
import { aprendizPaths, eleccionAprendizPaths } from '../paths';

export const aprendizRoutes: RouteObject[] = [
  {
    path: aprendizPaths.misInasistencias,
    handle: { breadcrumb: { label: 'Mis inasistencias' } },
    lazy: async () => {
      const { MisInasistenciasPage } = await import('../../pages/aprendiz/MisInasistenciasPage');
      return { Component: MisInasistenciasPage };
    },
  },
  {
    path: eleccionAprendizPaths.index,
    handle: { breadcrumb: { label: 'Elección representante' } },
    lazy: async () => {
      const { EleccionAprendizPage } = await import('../../pages/elecciones/EleccionAprendizPage');
      return { Component: EleccionAprendizPage };
    },
  },
];
