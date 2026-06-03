import type { RouteObject } from 'react-router-dom';
import { fichasPaths } from '../paths';

export const fichasRoutes: RouteObject[] = [
  {
    path: fichasPaths.index,
    handle: { breadcrumb: { label: 'Fichas' } },
    lazy: async () => {
      const { FichasCaracterizacion } = await import('../../pages/FichasCaracterizacion');
      return { Component: FichasCaracterizacion };
    },
  },
  {
    path: '/fichas/:fichaId',
    handle: {
      breadcrumb: (params: Record<string, string | undefined>) => [
        { label: 'Fichas', to: fichasPaths.index },
        { label: params.fichaId ? `Ficha ${params.fichaId}` : 'Ficha' },
      ],
    },
    lazy: async () => {
      const { FichaDetalle } = await import('../../pages/FichaDetalle');
      return { Component: FichaDetalle };
    },
  },
];
