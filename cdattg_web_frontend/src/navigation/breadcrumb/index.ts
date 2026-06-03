/**
 * Migas de pan (resolución y overrides).
 * - Nueva ruta: path en routes/paths.ts + handle.breadcrumb en routes/modules.
 * - Label dinámico: useBreadcrumbOverride() en la página.
 * - Menú lateral: navigation/sidebar (sin duplicar textos de migas).
 * - Rutas del SPA: solo routes/modules (sin capa legacy).
 */
export { BreadcrumbProvider, useBreadcrumbOverride, useBreadcrumbOverrides } from './context';
export { crumbsFromMatches, resolveBreadcrumbSegments } from './resolveCrumbs';
export type { AppRouteHandle, AppUiMatch, BreadcrumbCrumb, BreadcrumbHandleValue } from './types';
