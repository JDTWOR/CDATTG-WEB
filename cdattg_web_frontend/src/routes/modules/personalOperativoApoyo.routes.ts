import type { RouteObject } from 'react-router-dom';
import { personalOperativoApoyoPaths } from '../paths';

export const personalOperativoApoyoRoutes: RouteObject[] = [
  {
    path: personalOperativoApoyoPaths.index,
    handle: { breadcrumb: { label: 'Personal Operativo y de Apoyo' } },
    lazy: async () => {
      const { PersonalOperativoApoyo } = await import('../../pages/PersonalOperativoApoyo');
      return { Component: PersonalOperativoApoyo };
    },
  },
  {
    path: personalOperativoApoyoPaths.importar,
    handle: {
      breadcrumb: [
        { label: 'Personal Operativo y de Apoyo', to: personalOperativoApoyoPaths.index },
        { label: 'Importar' },
      ],
    },
    lazy: async () => {
      const { ImportarPersonalOperativoApoyo } = await import('../../pages/ImportarPersonalOperativoApoyo');
      return { Component: ImportarPersonalOperativoApoyo };
    },
  },
];