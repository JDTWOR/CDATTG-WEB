import type { RouteObject } from 'react-router-dom';
import { contratistasPaths } from '../paths';

export const contratistasRoutes: RouteObject[] = [
  {
    path: contratistasPaths.index,
    handle: { breadcrumb: { label: 'Contratistas' } },
    lazy: async () => {
      const { Contratistas } = await import('../../pages/Contratistas');
      return { Component: Contratistas };
    },
  },
  {
    path: contratistasPaths.importar,
    handle: {
      breadcrumb: [
        { label: 'Contratistas', to: contratistasPaths.index },
        { label: 'Importar' },
      ],
    },
    lazy: async () => {
      const { ImportarContratistas } = await import('../../pages/ImportarContratistas');
      return { Component: ImportarContratistas };
    },
  },
];