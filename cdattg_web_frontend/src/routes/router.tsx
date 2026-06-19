import { createElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RouteLoadingFallback } from '../components/RouteLoadingFallback';
import { ProtectedLayout } from './layouts/ProtectedLayout';
import { authRoutes } from './modules/auth.routes';
import { homeRoutes } from './modules/home.routes';
import { personasRoutes } from './modules/personas.routes';
import { instructoresRoutes } from './modules/instructores.routes';
import { aprendicesRoutes } from './modules/aprendices.routes';
import { programasRoutes } from './modules/programas.routes';
import { fichasRoutes } from './modules/fichas.routes';
import { asistenciaRoutes } from './modules/asistencia.routes';
import { bienestarRoutes } from './modules/bienestar.routes';
import { inventarioRoutes } from './modules/inventario.routes';
import { infraestructuraRoutes } from './modules/infraestructura.routes';
import { vigilanciaRoutes } from './modules/vigilancia.routes';
import { permisosRoutes } from './modules/permisos.routes';
import { administracionRoutes } from './modules/administracion.routes';
import { aprendizRoutes } from './modules/aprendiz.routes';

/**
 * Árbol de rutas (React Router v7 data router).
 * Convención al añadir ruta: path en paths.ts, nodo aquí con lazy + handle.breadcrumb.
 * Resolución de migas: navigation/breadcrumb (useMatches + overrides en páginas).
 */
export const appRouter = createBrowserRouter([
  ...authRoutes,
  {
    Component: ProtectedLayout,
    hydrateFallbackElement: createElement(RouteLoadingFallback),
    children: [
      ...homeRoutes,
      ...aprendizRoutes,
      ...personasRoutes,
      ...instructoresRoutes,
      ...aprendicesRoutes,
      ...programasRoutes,
      ...fichasRoutes,
      asistenciaRoutes,
      bienestarRoutes,
      ...inventarioRoutes,
      ...infraestructuraRoutes,
      ...vigilanciaRoutes,
      ...permisosRoutes,
      ...administracionRoutes,
    ],
  },
]);
