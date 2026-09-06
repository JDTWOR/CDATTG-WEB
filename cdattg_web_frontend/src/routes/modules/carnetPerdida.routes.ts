/**
 * Ruta del aprendiz para reportar la pérdida del carnet físico.
 * La bandeja de revisión del bibliotecario llega con el módulo de reposiciones.
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
];