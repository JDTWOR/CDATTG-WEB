import { type ReactNode, useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  UserGroupIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CubeIcon,
  ShoppingCartIcon,
  ClockIcon,
  ArrowUturnLeftIcon,
  MoonIcon,
  SunIcon,
  Bars3Icon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { AppBreadcrumb } from './navigation/AppBreadcrumb';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatRolesLine, getHomeRouteForUser } from '../utils/roles';
import { SIDEBAR_MANIFEST, SIDEBAR_PRIMARY_SECTION } from '../navigation/sidebar';
import { filterVisibleSidebarItems } from './layout/sidebarVisibility';
import { useChangePassword } from './layout/useChangePassword';
import { ChangePasswordModal } from './layout/ChangePasswordModal';
import { LayoutBrandLink } from './layout/LayoutBrandLink';
import { LayoutSidebar, sectionForPathname } from './layout/LayoutSidebar';
import { LayoutUserMenu } from './layout/LayoutUserMenu';

interface LayoutProps {
  children: ReactNode;
}

const SIDEBAR_HIDDEN_KEY = 'cdattg-sidebar-hidden';

function readSidebarHidden(): boolean {
  if (globalThis.window === undefined) return false;
  return globalThis.window.localStorage.getItem(SIDEBAR_HIDDEN_KEY) === 'true';
}

const ICONS: Record<string, ReactNode> = {
  perfil: <UsersIcon className="w-5 h-5" />,
  dashboard: <HomeIcon className="w-5 h-5" />,
  programas: <BookOpenIcon className="w-5 h-5" />,
  fichas: <DocumentTextIcon className="w-5 h-5" />,
  instructores: <BriefcaseIcon className="w-5 h-5" />,
  aprendices: <UserGroupIcon className="w-5 h-5" />,
  personas: <UsersIcon className="w-5 h-5" />,
  asistencia: <ClipboardDocumentListIcon className="w-5 h-5" />,
  'asistencia/historial': <CalendarDaysIcon className="w-5 h-5" />,
  'asistencia/mis-inasistencias': <CalendarDaysIcon className="w-5 h-5" />,
  'asistencia/dashboard': <ChartBarIcon className="w-5 h-5" />,
  'bienestar/casos': <ExclamationTriangleIcon className="w-5 h-5" />,
  'asistencia/tipos-observacion': <ClipboardDocumentListIcon className="w-5 h-5" />,
  inventario: <CubeIcon className="w-5 h-5" />,
  'inventario/dashboard': <CubeIcon className="w-5 h-5" />,
  'inventario/productos': <CubeIcon className="w-5 h-5" />,
  'inventario/ordenes': <ShoppingCartIcon className="w-5 h-5" />,
  'inventario/ordenes/pendientes': <ClockIcon className="w-5 h-5" />,
  'inventario/devoluciones': <ArrowUturnLeftIcon className="w-5 h-5" />,
  permisos: <ShieldCheckIcon className="w-5 h-5" />,
  'administracion/jornadas': <SunIcon className="w-5 h-5" />,
  'administracion/dias-sin-formacion': <CalendarDaysIcon className="w-5 h-5" />,
  'administracion/configuracion-asistencia': <ClipboardDocumentListIcon className="w-5 h-5" />,
  'infraestructura/sedes': <BuildingOffice2Icon className="w-5 h-5" />,
  'infraestructura/bloques': <BuildingOffice2Icon className="w-5 h-5" />,
  'infraestructura/pisos': <BuildingOffice2Icon className="w-5 h-5" />,
  'infraestructura/ambientes': <BuildingOffice2Icon className="w-5 h-5" />,
  'vigilancia/ambientes': <EyeIcon className="w-5 h-5" />,
};

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout, hasPermission, roles, permissions } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const changePassword = useChangePassword();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(readSidebarHidden);

  const visibleItems = useMemo(
    () => filterVisibleSidebarItems(SIDEBAR_MANIFEST, roles, hasPermission),
    [roles, hasPermission],
  );

  const [expandedSection, setExpandedSection] = useState<string | null>(() =>
    sectionForPathname(location.pathname, visibleItems),
  );

  useEffect(() => {
    globalThis.window.localStorage.setItem(SIDEBAR_HIDDEN_KEY, String(sidebarHidden));
  }, [sidebarHidden]);

  useEffect(() => {
    const activeSection = sectionForPathname(location.pathname, visibleItems);
    if (activeSection) setExpandedSection(activeSection);
  }, [location.pathname, visibleItems]);

  useEffect(() => {
    if (!sidebarOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const rolesLine = roles.length > 0 ? formatRolesLine(roles) : '';
  const brandPath = useMemo(() => getHomeRouteForUser(roles, permissions), [roles, permissions]);
  const primaryItems = visibleItems.filter((item) => item.section === SIDEBAR_PRIMARY_SECTION);
  const groupedSections = Array.from(
    new Set(visibleItems.filter((item) => item.section !== SIDEBAR_PRIMARY_SECTION).map((i) => i.section)),
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSectionToggle = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const handleSidebarToggle = () => {
    if (sidebarHidden) {
      setSidebarHidden(false);
      return;
    }
    if (globalThis.window?.matchMedia('(min-width: 768px)')?.matches) {
      setSidebarHidden(true);
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen(true);
  };

  const showNavbarBrand = sidebarHidden;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="app-header border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="container-fluid flex h-14 items-center justify-between px-3 sm:h-[3.5rem] sm:px-4">
          <ul className="navbar-nav flex min-w-0 items-center">
            <li className="nav-item">
              <button
                type="button"
                onClick={handleSidebarToggle}
                className="nav-link flex touch-manipulation items-center px-3 py-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                aria-label={sidebarHidden ? 'Mostrar menú' : 'Alternar menú'}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </li>
            {showNavbarBrand ? (
              <li className="nav-item min-w-0">
                <LayoutBrandLink
                  to={brandPath}
                  variant="navbar"
                  className="px-2 py-2"
                  onClick={() => setSidebarOpen(false)}
                />
              </li>
            ) : (
              <li className="nav-item min-w-0 md:hidden">
                <LayoutBrandLink
                  to={brandPath}
                  variant="navbar"
                  className="px-2 py-2"
                  onClick={() => setSidebarOpen(false)}
                />
              </li>
            )}
          </ul>
          <ul className="navbar-nav ms-auto flex shrink-0 items-center gap-1">
            <li className="nav-item">
              <button
                type="button"
                onClick={toggleTheme}
                className="nav-link flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center px-3 py-2 text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white md:min-h-0 md:min-w-0"
                title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
                aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5" />
                ) : (
                  <SunIcon className="h-5 w-5 text-yellow-400" />
                )}
              </button>
            </li>
            <li className="nav-item">
              <LayoutUserMenu
                userName={user?.full_name}
                userEmail={user?.email}
                rolesLine={rolesLine}
                homePath={brandPath}
                onOpenChangePassword={changePassword.openModal}
                onLogout={handleLogout}
              />
            </li>
          </ul>
        </div>
      </nav>

      <ChangePasswordModal
        open={changePassword.open}
        passwordActual={changePassword.passwordActual}
        passwordNueva={changePassword.passwordNueva}
        passwordNuevaConfirm={changePassword.passwordNuevaConfirm}
        error={changePassword.error}
        success={changePassword.success}
        loading={changePassword.loading}
        onClose={changePassword.closeModal}
        onSubmit={changePassword.handleSubmit}
        onPasswordActualChange={changePassword.setPasswordActual}
        onPasswordNuevaChange={changePassword.setPasswordNueva}
        onPasswordNuevaConfirmChange={changePassword.setPasswordNuevaConfirm}
      />

      {sidebarOpen ? (
        <button
          type="button"
          className={`fixed inset-0 z-40 bg-black/50 ${sidebarHidden ? '' : 'md:hidden'}`}
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex">
        <LayoutSidebar
          sidebarOpen={sidebarOpen}
          sidebarHidden={sidebarHidden}
          brandPath={brandPath}
          pathname={location.pathname}
          visibleItems={visibleItems}
          primaryItems={primaryItems}
          groupedSections={groupedSections}
          expandedSection={expandedSection}
          icons={ICONS}
          onClose={() => setSidebarOpen(false)}
          onHide={() => {
            setSidebarHidden(true);
            setSidebarOpen(false);
          }}
          onShowDocked={() => {
            setSidebarHidden(false);
            setSidebarOpen(false);
          }}
          onSectionToggle={handleSectionToggle}
        />

        <main className="min-w-0 flex-1 p-4 dark:bg-gray-900 sm:p-6">
          <AppBreadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
};
