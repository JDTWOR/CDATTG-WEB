import type { RouteObject } from 'react-router-dom';
import { instructorPaths, instructoresPaths } from '../paths';

export const instructoresRoutes: RouteObject[] = [
  {
    path: instructorPaths.validarCarnet,
    handle: { breadcrumb: { label: 'Validar carnet' } },
    lazy: async () => {
      const { CarnetValidarPage } = await import('../../pages/carnets/CarnetValidarPage');
      return { Component: CarnetValidarPage };
    },
  },
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
