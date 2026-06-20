import type { RouteObject } from 'react-router-dom';
import { administracionPaths } from '../paths';

export const administracionRoutes: RouteObject[] = [
  {
    path: administracionPaths.jornadas,
    handle: { breadcrumb: { label: 'Jornadas de formación' } },
    lazy: async () => {
      const { AdministracionJornadasPage } = await import('../../pages/administracion/AdministracionJornadasPage');
      return { Component: AdministracionJornadasPage };
    },
  },
  {
    path: administracionPaths.diasSinFormacion,
    handle: { breadcrumb: { label: 'Días sin formación' } },
    lazy: async () => {
      const { AdministracionDiasSinFormacionPage } = await import(
        '../../pages/administracion/AdministracionDiasSinFormacionPage'
      );
      return { Component: AdministracionDiasSinFormacionPage };
    },
  },
  {
    path: administracionPaths.configuracionAsistencia,
    handle: { breadcrumb: { label: 'Configuración de asistencia' } },
    lazy: async () => {
      const { AdministracionConfiguracionAsistenciaPage } = await import(
        '../../pages/administracion/AdministracionConfiguracionAsistenciaPage'
      );
      return { Component: AdministracionConfiguracionAsistenciaPage };
    },
  },
];
