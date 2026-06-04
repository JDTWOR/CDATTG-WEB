import { Outlet } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { asistenciaPaths } from '../paths';

export const asistenciaRoutes: RouteObject = {
  path: asistenciaPaths.index,
  Component: Outlet,
  handle: { breadcrumb: { label: 'Asistencia', to: asistenciaPaths.index } },
  children: [
    {
      index: true,
      lazy: async () => {
        const { AsistenciaIndex } = await import('../../pages/asistencia/AsistenciaIndex');
        return { Component: AsistenciaIndex };
      },
    },
    {
      path: 'fichas/:fichaId/sesion',
      handle: {
        breadcrumb: { label: 'Tomar asistencia' },
      },
      lazy: async () => {
        const { AsistenciaSesionPage } = await import('../../pages/asistencia/AsistenciaSesionPage');
        return { Component: AsistenciaSesionPage };
      },
    },
    {
      path: 'historial',
      handle: { breadcrumb: { label: 'Historial', to: asistenciaPaths.historial.index } },
      children: [
        {
          index: true,
          lazy: async () => {
            const { AsistenciaHistorial } = await import('../../pages/AsistenciaHistorial');
            return { Component: AsistenciaHistorial };
          },
        },
        {
          path: 'fichas/:fichaId',
          handle: {
            breadcrumb: (params: Record<string, string | undefined>) => ({
              label: params.fichaId ? `Ficha ${params.fichaId}` : 'Ficha',
            }),
          },
          lazy: async () => {
            const { AsistenciaHistorialFicha } = await import('../../pages/AsistenciaHistorialFicha');
            return { Component: AsistenciaHistorialFicha };
          },
        },
      ],
    },
    {
      path: 'dashboard',
      handle: { breadcrumb: { label: 'Dashboard' } },
      lazy: async () => {
        const { AsistenciaDashboard } = await import('../../pages/AsistenciaDashboard');
        return { Component: AsistenciaDashboard };
      },
    },
    {
      path: 'tipos-observacion',
      handle: { breadcrumb: { label: 'Tipos de observación' } },
      lazy: async () => {
        const { AsistenciaTiposObservacion } = await import('../../pages/AsistenciaTiposObservacion');
        return { Component: AsistenciaTiposObservacion };
      },
    },
  ],
};
