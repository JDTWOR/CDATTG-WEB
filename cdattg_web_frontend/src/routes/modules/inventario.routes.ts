import type { RouteObject } from 'react-router-dom';
import { inventarioPaths } from '../paths';

export const inventarioRoutes: RouteObject[] = [
  {
    path: inventarioPaths.dashboard,
    handle: { breadcrumb: { label: 'Inventario' } },
    lazy: async () => {
      const { InventarioDashboard } = await import('../../pages/InventarioDashboard');
      return { Component: InventarioDashboard };
    },
  },
  {
    path: inventarioPaths.productos,
    handle: {
      breadcrumb: [
        { label: 'Inventario', to: inventarioPaths.dashboard },
        { label: 'Productos' },
      ],
    },
    lazy: async () => {
      const { InventarioProductos } = await import('../../pages/InventarioProductos');
      return { Component: InventarioProductos };
    },
  },
  {
    path: inventarioPaths.ordenes.index,
    handle: {
      breadcrumb: [
        { label: 'Inventario', to: inventarioPaths.dashboard },
        { label: 'Órdenes' },
      ],
    },
    lazy: async () => {
      const { InventarioOrdenes } = await import('../../pages/InventarioOrdenes');
      return { Component: InventarioOrdenes };
    },
  },
  {
    path: inventarioPaths.ordenes.pendientes,
    handle: {
      breadcrumb: [
        { label: 'Inventario', to: inventarioPaths.dashboard },
        { label: 'Órdenes pendientes' },
      ],
    },
    lazy: async () => {
      const { InventarioPendientesAprobacion } = await import('../../pages/InventarioPendientesAprobacion');
      return { Component: InventarioPendientesAprobacion };
    },
  },
  {
    path: '/inventario/ordenes/:id',
    handle: {
      breadcrumb: (params: Record<string, string | undefined>) => [
        { label: 'Inventario', to: inventarioPaths.dashboard },
        { label: 'Órdenes', to: inventarioPaths.ordenes.index },
        { label: params.id ? `Orden ${params.id}` : 'Orden' },
      ],
    },
    lazy: async () => {
      const { InventarioOrdenDetalle } = await import('../../pages/InventarioOrdenDetalle');
      return { Component: InventarioOrdenDetalle };
    },
  },
  {
    path: inventarioPaths.devoluciones,
    handle: {
      breadcrumb: [
        { label: 'Inventario', to: inventarioPaths.dashboard },
        { label: 'Devoluciones' },
      ],
    },
    lazy: async () => {
      const { InventarioDevoluciones } = await import('../../pages/InventarioDevoluciones');
      return { Component: InventarioDevoluciones };
    },
  },
];
