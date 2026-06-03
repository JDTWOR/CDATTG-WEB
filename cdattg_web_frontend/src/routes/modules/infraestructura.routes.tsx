import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { infraestructuraPaths } from '../paths';

export const infraestructuraRoutes: RouteObject[] = [
  {
    path: infraestructuraPaths.index,
    Component: () => <Navigate to={infraestructuraPaths.sedes} replace />,
  },
  { path: '/infra', Component: () => <Navigate to={infraestructuraPaths.sedes} replace /> },
  { path: '/infra/*', Component: () => <Navigate to={infraestructuraPaths.sedes} replace /> },
  {
    path: infraestructuraPaths.sedes,
    handle: {
      breadcrumb: [
        { label: 'Infraestructura', to: infraestructuraPaths.sedes },
        { label: 'Sedes' },
      ],
    },
    lazy: async () => {
      const { InfraestructuraSedesPage } = await import('../../pages/infraestructura/InfraestructuraSedesPage');
      return { Component: InfraestructuraSedesPage };
    },
  },
  {
    path: infraestructuraPaths.bloques,
    handle: {
      breadcrumb: [
        { label: 'Infraestructura', to: infraestructuraPaths.sedes },
        { label: 'Bloques' },
      ],
    },
    lazy: async () => {
      const { InfraestructuraBloquesPage } = await import('../../pages/infraestructura/InfraestructuraBloquesPage');
      return { Component: InfraestructuraBloquesPage };
    },
  },
  {
    path: infraestructuraPaths.pisos,
    handle: {
      breadcrumb: [
        { label: 'Infraestructura', to: infraestructuraPaths.sedes },
        { label: 'Pisos' },
      ],
    },
    lazy: async () => {
      const { InfraestructuraPisosPage } = await import('../../pages/infraestructura/InfraestructuraPisosPage');
      return { Component: InfraestructuraPisosPage };
    },
  },
  {
    path: infraestructuraPaths.ambientes,
    handle: {
      breadcrumb: [
        { label: 'Infraestructura', to: infraestructuraPaths.sedes },
        { label: 'Ambientes de formación' },
      ],
    },
    lazy: async () => {
      const { InfraestructuraAmbientesPage } = await import(
        '../../pages/infraestructura/InfraestructuraAmbientesPage'
      );
      return { Component: InfraestructuraAmbientesPage };
    },
  },
];
