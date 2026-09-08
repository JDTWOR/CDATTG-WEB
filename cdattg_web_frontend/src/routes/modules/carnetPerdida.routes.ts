/**
 * Rutas del submódulo de pérdida de carnet: el aprendiz solicita y revisa su
 * historial; el bibliotecario valida desde la bandeja de reposiciones.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { RouteObject } from 'react-router-dom';
import { carnetPerdidaPaths } from '../paths';

export const carnetPerdidaRoutes: RouteObject[] = [
  {
    path: carnetPerdidaPaths.solicitar,
    handle: { breadcrumb: { label: 'Pérdida de carnet físico' } },
    lazy: async () => {
      const { CarnetPerdidaPage } = await import('../../pages/carnets/perdida/CarnetPerdidaPage');
      return { Component: CarnetPerdidaPage };
    },
  },
  {
    path: carnetPerdidaPaths.revisar,
    handle: { breadcrumb: { label: 'Reposiciones de carnet' } },
    lazy: async () => {
      const { CarnetPerdidaRevisionPage } = await import('../../pages/carnets/perdida/CarnetPerdidaRevisionPage');
      return { Component: CarnetPerdidaRevisionPage };
    },
  },
];