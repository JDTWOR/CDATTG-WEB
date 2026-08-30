/**
 * Aquí están las pantallas del sistema para quien administra investigación:
 * semilleros, presentación, banners, revista, boletines, podcast, etc.
 * Van con sesión y permiso GESTIONAR SEMILLERO. No son el portal público.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import type { RouteObject } from 'react-router-dom';
import { semilleroAdminPaths } from '../paths';
import type { EditorialKind } from '../../types/biogjgas';

function editorial(kind: EditorialKind): RouteObject['lazy'] {
  return async () => {
    const { InvestigacionEditorialPage } = await import('../../pages/semillero/InvestigacionEditorialPage');
    return { Component: () => createElement(InvestigacionEditorialPage, { kind }) };
  };
}

export const semilleroAdminRoutes: RouteObject = {
  path: semilleroAdminPaths.index,
  handle: { breadcrumb: { label: 'Investigación', to: semilleroAdminPaths.index } },
  children: [
    {
      index: true,
      lazy: async () => {
        const { SemilleroAdminPage } = await import('../../pages/semillero/SemilleroAdminPage');
        return { Component: SemilleroAdminPage };
      },
    },
    {
      path: 'nuevo',
      handle: { breadcrumb: { label: 'Nuevo' } },
      lazy: async () => {
        const { SemilleroFormPage } = await import('../../pages/semillero/SemilleroFormPage');
        return { Component: SemilleroFormPage };
      },
    },
    {
      path: 'contenido',
      handle: { breadcrumb: { label: 'Presentación' } },
      lazy: async () => {
        const { PortalContenidoPage } = await import('../../pages/semillero/PortalContenidoPage');
        return { Component: PortalContenidoPage };
      },
    },
    { path: 'banners', handle: { breadcrumb: { label: 'Banners' } }, lazy: editorial('banners') },
    { path: 'revista', handle: { breadcrumb: { label: 'Revista' } }, lazy: editorial('revistas') },
    { path: 'boletines', handle: { breadcrumb: { label: 'Boletines' } }, lazy: editorial('boletines') },
    { path: 'podcast', handle: { breadcrumb: { label: 'Podcast' } }, lazy: editorial('podcasts') },
    { path: 'convocatorias', handle: { breadcrumb: { label: 'Convocatorias' } }, lazy: editorial('convocatorias') },
    { path: 'actividades', handle: { breadcrumb: { label: 'Actividades' } }, lazy: editorial('actividades') },
    {
      path: ':id/editar',
      handle: { breadcrumb: { label: 'Editar' } },
      lazy: async () => {
        const { SemilleroFormPage } = await import('../../pages/semillero/SemilleroFormPage');
        return { Component: SemilleroFormPage };
      },
    },
  ],
};
