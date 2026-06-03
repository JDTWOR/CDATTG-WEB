import type { RouteObject } from 'react-router-dom';
import { instructoresPaths } from '../paths';

export const instructoresRoutes: RouteObject[] = [
  {
    path: instructoresPaths.index,
    handle: { breadcrumb: { label: 'Instructores' } },
    lazy: async () => {
      const { Instructores } = await import('../../pages/Instructores');
      return { Component: Instructores };
    },
  },
  {
    path: instructoresPaths.importar,
    handle: {
      breadcrumb: [
        { label: 'Instructores', to: instructoresPaths.index },
        { label: 'Importar' },
      ],
    },
    lazy: async () => {
      const { ImportarInstructores } = await import('../../pages/ImportarInstructores');
      return { Component: ImportarInstructores };
    },
  },
];
