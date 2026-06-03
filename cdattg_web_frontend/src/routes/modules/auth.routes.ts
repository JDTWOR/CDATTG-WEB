import type { RouteObject } from 'react-router-dom';

export const authRoutes: RouteObject[] = [
  {
    path: '/login',
    lazy: async () => {
      const { Login } = await import('../../pages/Login');
      return { Component: Login };
    },
  },
];
