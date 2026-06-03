import type { RouteObject } from 'react-router-dom';
import { vigilanciaPaths } from '../paths';

export const vigilanciaRoutes: RouteObject[] = [
  {
    path: vigilanciaPaths.ambientes,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Ambientes' }],
    },
    lazy: async () => {
      const { VigilanciaAmbientes } = await import('../../pages/VigilanciaAmbientes');
      return { Component: VigilanciaAmbientes };
    },
  },
];
