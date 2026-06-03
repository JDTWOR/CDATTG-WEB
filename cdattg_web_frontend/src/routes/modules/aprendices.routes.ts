import type { RouteObject } from 'react-router-dom';
import { aprendicesPaths } from '../paths';

export const aprendicesRoutes: RouteObject[] = [
  {
    path: aprendicesPaths.index,
    handle: { breadcrumb: { label: 'Aprendices' } },
    lazy: async () => {
      const { Aprendices } = await import('../../pages/Aprendices');
      return { Component: Aprendices };
    },
  },
];
