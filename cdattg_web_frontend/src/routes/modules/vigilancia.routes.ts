import type { RouteObject } from 'react-router-dom';
import { vigilanciaPaths } from '../paths';

export const vigilanciaRoutes: RouteObject[] = [
  {
    path: vigilanciaPaths.porteria,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Portería' }],
    },
    lazy: async () => {
      const { VigilanciaPorteria } = await import('../../pages/VigilanciaPorteria');
      return { Component: VigilanciaPorteria };
    },
  },
  {
    path: vigilanciaPaths.reporte,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Reporte de accesos' }],
    },
    lazy: async () => {
      const { VigilanciaAccesoPanel } = await import('../../pages/VigilanciaAccesoPanel');
      return { Component: VigilanciaAccesoPanel };
    },
  },
  {
    path: vigilanciaPaths.ambientes,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Ambientes' }],
    },
    lazy: async () => {
      const { VigilanciaAmbientes } = await import('../../pages/VigilanciaAmbientes');
      return { Component: VigilanciaAmbientes };
    },
  },
  {
    path: vigilanciaPaths.registroPersonas,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Registro de personas' }],
    },
    lazy: async () => {
      const { VigilanciaRegistroPersonas } = await import('../../pages/VigilanciaRegistroPersonas');
      return { Component: VigilanciaRegistroPersonas };
    },
  },
  {
    path: vigilanciaPaths.cambiosPendientes,
    handle: {
      breadcrumb: [{ label: 'Vigilancia' }, { label: 'Cambios pendientes' }],
    },
    lazy: async () => {
      const { VigilanciaCambiosPendientes } = await import('../../pages/VigilanciaCambiosPendientes');
      return { Component: VigilanciaCambiosPendientes };
    },
  },
];
