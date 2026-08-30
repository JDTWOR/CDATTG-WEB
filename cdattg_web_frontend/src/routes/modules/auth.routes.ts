import { createElement } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RouteLoadingFallback } from '../../components/RouteLoadingFallback';

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    hydrateFallbackElement: createElement(RouteLoadingFallback),
    lazy: async () => {
      const { Login } = await import('../../pages/Login');
      return { Component: Login };
    },
  },
  {
    path: '/registro',
    hydrateFallbackElement: createElement(RouteLoadingFallback),
    lazy: async () => {
      const { RegistroPage } = await import('../../pages/registro/RegistroPage');
      return { Component: RegistroPage };
    },
  },
];
