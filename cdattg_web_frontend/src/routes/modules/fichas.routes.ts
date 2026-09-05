import type { RouteObject } from 'react-router-dom';
import { fichasPaths } from '../paths';

const lazyFichasList = async () => {
  const { FichasCaracterizacion } = await import('../../pages/FichasCaracterizacion');
  return { Component: FichasCaracterizacion };
};

const lazyFichaDetalle = async () => {
  const { FichaDetalle } = await import('../../pages/FichaDetalle');
  return { Component: FichaDetalle };
};

function detalleBreadcrumb(listLabel: string, listPath: string) {
  return (params: Record<string, string | undefined>) => [
    { label: listLabel, to: listPath },
    {
      label: params.fichaNumero
        ? `Ficha ${decodeURIComponent(params.fichaNumero)}`
        : 'Ficha',
    },
  ];
}

export const fichasRoutes: RouteObject[] = [
  {
    path: fichasPaths.index,
    handle: { breadcrumb: { label: 'Formación Regular' } },
    lazy: lazyFichasList,
  },
  {
    path: fichasPaths.mediaTecnica,
    handle: { breadcrumb: { label: 'Media Técnica' } },
    lazy: lazyFichasList,
  },
  {
    path: fichasPaths.complementaria,
    handle: { breadcrumb: { label: 'Formación Complementaria' } },
    lazy: lazyFichasList,
  },
  {
    path: `${fichasPaths.mediaTecnica}/:fichaNumero`,
    handle: {
      breadcrumb: detalleBreadcrumb('Media Técnica', fichasPaths.mediaTecnica),
    },
    lazy: lazyFichaDetalle,
  },
  {
    path: `${fichasPaths.complementaria}/:fichaNumero`,
    handle: {
      breadcrumb: detalleBreadcrumb('Formación Complementaria', fichasPaths.complementaria),
    },
    lazy: lazyFichaDetalle,
  },
  {
    path: `${fichasPaths.index}/:fichaNumero`,
    handle: {
      breadcrumb: detalleBreadcrumb('Formación Regular', fichasPaths.index),
    },
    lazy: lazyFichaDetalle,
  },
];
