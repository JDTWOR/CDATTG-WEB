/**
 * Ruta del submódulo de Notificaciones, cargada en diferido.
 *
 * @author Cristian Deysdayr Jiménez
 */
import type { RouteObject } from 'react-router-dom';
import { notificacionesPaths } from '../paths';

export const notificacionesRoutes: RouteObject[] = [
  {
    path: notificacionesPaths.index,
    handle: { breadcrumb: { label: 'Notificaciones' } },
    lazy: async () => {
      const { NotificacionesPage } = await import('../../pages/notificaciones/NotificacionesPage');
      return { Component: NotificacionesPage };
    },
  },
];