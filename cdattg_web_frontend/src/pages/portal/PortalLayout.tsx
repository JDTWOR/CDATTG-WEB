/**
 * Esta es la cabecera del portal público (sin menú lateral).
 * Lo hice para que Inicio, Investigación, login, registro y el modo claro/oscuro
 * se vean igual en todas las páginas públicas.
 * Lo usan las rutas de portal.routes. ThemeToggle está al lado de Iniciar sesión.
 * @author Cristian Deysdayr Jiménez
 */
import { Outlet } from 'react-router-dom';
import { AppLink, AppNavLink } from '../../components/AppLink';
import {
  HomeIcon,
  BeakerIcon,
  ArrowRightEndOnRectangleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import LogoSena from '../../../logo-sena-verde-complementario-svg-2022.svg';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useAuth } from '../../context/AuthContext';
import { portalPaths, registroPath } from '../../routes/paths';
import { getHomeRouteForUser } from '../../utils/roles';

/**
 * Pinto Inicio/Investigación en verde si esa es la página actual.
 * @param isActive Si el enlace coincide con la URL
 * @returns Clases del enlace
 */
function claseNav({ isActive }: { isActive: boolean }): string {
  // Verde SENA si estoy en esa página; gris si no.
  return `inline-flex items-center gap-1.5 text-sm ${
    isActive ? 'font-semibold text-sena-green' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
  }`;
}

/**
 * Marco SENA, menú, login/registro (o “Ir al sistema”) y luna/sol.
 * @returns Cabecera + el contenido de la página (Outlet)
 */
export function PortalLayout() {
  // Si ya inició sesión, en vez de login muestro “Ir al sistema”.
  const { isAuthenticated, roles, permissions } = useAuth();
  return (
    // Fondo gris claro (o oscuro si activaron el modo noche).
    <div className="min-h-screen bg-[#f4f6f8] dark:bg-gray-900">
      {/* sticky: la cabecera se queda arriba al bajar. */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* Mismo ancho max-w-6xl que el carrusel y las tarjetas. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          {/* Logo: clic vuelve al inicio del portal. */}
          <AppLink path={portalPaths.index} className="flex items-center gap-2">
            <img src={LogoSena} alt="SENA" className="h-9 w-9" />
            <span className="text-sm font-semibold text-gray-800 dark:text-white sm:text-base">
              SENA Regional Guaviare
            </span>
          </AppLink>
          <nav className="flex flex-wrap items-center gap-5" aria-label="Portal">
            <AppNavLink path={portalPaths.index} end className={claseNav}>
              <HomeIcon className="h-4 w-4" /> Inicio
            </AppNavLink>
            <AppNavLink path={portalPaths.investigacion} className={claseNav}>
              <BeakerIcon className="h-4 w-4" /> Investigación
            </AppNavLink>
          </nav>
          <nav className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            {isAuthenticated ? (
              <AppLink path={getHomeRouteForUser(roles, permissions)} className="hover:text-gray-900 dark:hover:text-white">
                Ir al sistema
              </AppLink>
            ) : (
              <>
                <AppLink path="/login" className="inline-flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white">
                  <ArrowRightEndOnRectangleIcon className="h-4 w-4" /> Iniciar Sesión
                </AppLink>
                <AppLink path={registroPath} className="inline-flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white">
                  <UserPlusIcon className="h-4 w-4" /> Registrarse
                </AppLink>
              </>
            )}
            {/* Luna/sol: mismo botón que en login, para el portal. */}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      {/* Aquí React pinta la página de abajo (inicio, investigación, etc.). */}
      <Outlet />
    </div>
  );
}
