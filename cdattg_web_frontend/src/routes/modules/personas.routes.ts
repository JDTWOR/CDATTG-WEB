import type { RouteObject } from 'react-router-dom';
import { personasPaths } from '../paths';

export const personasRoutes: RouteObject[] = [
  {
    path: personasPaths.index,
    handle: { breadcrumb: { label: 'Personas' } },
    lazy: async () => {
      const { Personas } = await import('../../pages/Personas');
      return { Component: Personas };
    },
  },
  {
    path: personasPaths.importar,
    handle: {
      breadcrumb: [
        { label: 'Personas', to: personasPaths.index },
        { label: 'Importar' },
      ],
    },
    lazy: async () => {
      const { ImportarPersonas } = await import('../../pages/ImportarPersonas');
      return { Component: ImportarPersonas };
    },
  },
];
