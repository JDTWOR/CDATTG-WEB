import type { RouteObject } from 'react-router-dom';
import { programasPaths } from '../paths';

export const programasRoutes: RouteObject[] = [
  {
    path: programasPaths.index,
    handle: { breadcrumb: { label: 'Programas' } },
    lazy: async () => {
      const { ProgramasFormacion } = await import('../../pages/ProgramasFormacion');
      return { Component: ProgramasFormacion };
    },
  },
  {
    path: programasPaths.importar,
    handle: {
      breadcrumb: [
        { label: 'Programas', to: programasPaths.index },
        { label: 'Importar' },
      ],
    },
    lazy: async () => {
      const { ImportarProgramas } = await import('../../pages/ImportarProgramas');
      return { Component: ImportarProgramas };
    },
  },
];
