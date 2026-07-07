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
      handle: { breadcrumb: { label: 'Dashboard' } },
      lazy: async () => {
        const { AsistenciaModuleIndex } = await import('../../pages/asistencia/AsistenciaModuleIndex');
        return { Component: AsistenciaModuleIndex };
      },
    },
    {
      path: 'fichas',
      handle: { breadcrumb: { label: 'Tomar asistencia', to: asistenciaPaths.fichas } },
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
            breadcrumb: { label: 'Ficha' },
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
      lazy: async () => {
        const { AsistenciaDashboardRedirect } = await import('../../pages/asistencia/AsistenciaDashboardRedirect');
        return { Component: AsistenciaDashboardRedirect };
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
    {
      path: 'sesiones-sin-asistencia-tomada',
      handle: { breadcrumb: { label: 'Sesiones sin asistencia tomada' } },
      lazy: async () => {
        const { SesionesSinAsistenciaTomadaPage } = await import('../../pages/asistencia/SesionesSinAsistenciaTomadaPage');
        return { Component: SesionesSinAsistenciaTomadaPage };
      },
    },
    {
      path: 'analisis',
      handle: { breadcrumb: { label: 'Panel analítico de asistencia' } },
      lazy: async () => {
        const { PanelAnaliticoAsistenciaPage } = await import('../../pages/asistencia-analisis/PanelAnaliticoAsistenciaPage');
        return { Component: PanelAnaliticoAsistenciaPage };
      },
    },
  ],
};
