/**
 * Aquí armo las URLs del portal público: / es el inicio, /investigacion el área BIOGIGAS.
 * Lo puse en PortalLayout. Si no hay sesión, el visitante entra aquí y no al login.
 * @author Cristian Deysdayr Jiménez
 */
import { createElement } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '../../components/RouteLoadingFallback';
import { portalPaths } from '../paths';
import { investigacionPublicChildren } from './investigacion.public.routes';

export const portalPublicRoutes: RouteObject = {
  path: portalPaths.index,
  hydrateFallbackElement: createElement(RouteLoadingFallback),
  lazy: async () => {
    // Cabecera SENA + Inicio / Investigación / login.
    const { PortalLayout } = await import('../../pages/portal/PortalLayout');
    return { Component: PortalLayout };
  },
  children: [
    {
      index: true,
      lazy: async () => {
        // /  →  primera pantalla (carrusel + atajo BIOGIGAS).
        const { PortalHomePage } = await import('../../pages/portal/PortalHomePage');
        return { Component: PortalHomePage };
      },
    },
    // /investigacion, revista, semilleros, etc.
    ...investigacionPublicChildren,
  ],
};
