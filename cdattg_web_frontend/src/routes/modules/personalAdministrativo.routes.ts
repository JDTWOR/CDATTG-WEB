import type { RouteObject } from 'react-router-dom';
import { personalAdministrativoPaths } from '../paths';

export const personalAdministrativoRoutes: RouteObject[] = [
  {
    path: personalAdministrativoPaths.index,
    handle: { breadcrumb: { label: 'Personal Administrativo' } },
    lazy: async () => {
      const { PersonalAdministrativo } = await import('../../pages/PersonalAdministrativo');
      return { Component: PersonalAdministrativo };
    },
  },
  {
    path: personalAdministrativoPaths.importar,
    handle: {
      breadcrumb: [
        { label: 'Personal Administrativo', to: personalAdministrativoPaths.index },
        { label: 'Importar' },
      ],
    },
    lazy: async () => {
      const { ImportarPersonalAdministrativo } = await import('../../pages/ImportarPersonalAdministrativo');
      return { Component: ImportarPersonalAdministrativo };
    },
  },
];