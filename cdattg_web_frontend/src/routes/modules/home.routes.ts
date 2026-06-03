import type { RouteObject } from 'react-router-dom';
import { HomeRedirect } from '../../components/HomeRedirect';
import { DASHBOARD_PATH, PERFIL_PATH } from '../paths';

export const homeRoutes: RouteObject[] = [
  { path: '/', Component: HomeRedirect },
  {
    path: PERFIL_PATH,
    handle: { breadcrumb: { label: 'Mi perfil' } },
    lazy: async () => {
      const { Perfil } = await import('../../pages/Perfil');
      return { Component: Perfil };
    },
  },
  {
    path: DASHBOARD_PATH,
    handle: { breadcrumb: { label: 'Dashboard' } },
    lazy: async () => {
      const { Dashboard } = await import('../../pages/Dashboard');
      return { Component: Dashboard };
    },
  },
];
