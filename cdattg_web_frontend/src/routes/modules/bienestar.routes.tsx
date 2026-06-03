import { Navigate, Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { bienestarPaths } from '../paths';

export const bienestarRoutes: RouteObject = {
  path: bienestarPaths.index,
  Component: Outlet,
  handle: { breadcrumb: { label: 'Bienestar al aprendiz', to: bienestarPaths.index } },
  children: [
    {
      index: true,
      Component: () => <Navigate to={bienestarPaths.casos.index} replace />,
    },
    {
      path: 'casos',
      handle: {
        breadcrumb: { label: 'Casos a tener en cuenta', to: bienestarPaths.casos.index },
      },
      children: [
        {
          index: true,
          lazy: async () => {
            const { CasosBienestarPage } = await import('../../pages/bienestar/casos/CasosBienestarPage');
            return { Component: CasosBienestarPage };
          },
        },
        {
          path: 'fichas/:fichaNumero',
          handle: {
            breadcrumb: (params: Record<string, string | undefined>) => ({
              label: params.fichaNumero
                ? `Ficha ${decodeURIComponent(params.fichaNumero)}`
                : 'Ficha',
            }),
          },
          lazy: async () => {
            const { CasosBienestarFichaDetallePage } = await import(
              '../../pages/bienestar/casos/CasosBienestarFichaDetallePage'
            );
            return { Component: CasosBienestarFichaDetallePage };
          },
        },
      ],
    },
  ],
};
