import type { RouteObject } from 'react-router-dom';
import {
  RedirectAsistenciaFichaLegacy,
  RedirectAsistenciaHistorialFichaLegacy,
  RedirectCasosBienestarFichaLegacy,
  RedirectCasosBienestarLegacy,
} from '../legacyRedirects';

export const legacyRoutes: RouteObject[] = [
  { path: '/asistencia/ficha/:fichaId', Component: RedirectAsistenciaFichaLegacy },
  { path: '/asistencia/historial/ficha/:fichaId', Component: RedirectAsistenciaHistorialFichaLegacy },
  { path: '/asistencia/dashboard/casos-bienestar', Component: RedirectCasosBienestarLegacy },
  {
    path: '/asistencia/dashboard/casos-bienestar/ficha/:fichaNumero',
    Component: RedirectCasosBienestarFichaLegacy,
  },
  {
    path: '/asistencia/dashboard/casos-bienestar/fichas/:fichaNumero',
    Component: RedirectCasosBienestarFichaLegacy,
  },
];
