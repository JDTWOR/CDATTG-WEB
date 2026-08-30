/**
 * Ruta de biblioteca para ver carnets regulares ya validados.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { RouteObject } from 'react-router-dom';
import { bibliotecaPaths } from '../paths';

export const bibliotecaRoutes: RouteObject[] = [
  {
    path: bibliotecaPaths.carnets,
    handle: { breadcrumb: { label: 'Carnets regulares' } },
    lazy: async () => {
      const { CarnetBibliotecaPage } = await import('../../pages/carnets/CarnetBibliotecaPage');
      return { Component: CarnetBibliotecaPage };
    },
  },
];
