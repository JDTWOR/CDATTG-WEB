import { type ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  KeyIcon,
  XMarkIcon,
  Bars3Icon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';

interface LayoutProps {
  children: ReactNode;
}

const navLinkClass = (isActive: boolean) =>
  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
    isActive
      ? 'bg-primary-100 text-primary-700 font-medium dark:bg-primary-900/40 dark:text-primary-300'
      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
  }`;

/** Permiso requerido: null = siempre visible. roleRequired: solo si el usuario tiene ese rol (ej. SUPER ADMINISTRADOR). */
const SIDEBAR_ITEMS: { section: string; path: string; label: string; permission: string | null; roleRequired?: string }[] = [
  { section: 'Inicio', path: '/dashboard', label: 'Dashboard', permission: null },
  { section: 'Gestión académica', path: '/programas', label: 'Programas', permission: 'VER PROGRAMAS' },
  { section: 'Gestión académica', path: '/fichas', label: 'Fichas', permission: 'VER FICHAS' },
  { section: 'Gestión de personal', path: '/instructores', label: 'Instructores', permission: 'VER FICHAS' },
  { section: 'Gestión de personal', path: '/aprendices', label: 'Aprendices', permission: 'VER APRENDICES' },
  { section: 'Gestión de personal', path: '/personas', label: 'Personas', permission: 'VER PERSONAS' },
  { section: 'Control y seguimiento', path: '/asistencia', label: 'Asistencia', permission: 'VER ASISTENCIA' },
  { section: 'Control y seguimiento', path: '/asistencia/dashboard', label: 'Dashboard Asistencia', permission: null, roleRequired: 'SUPER ADMINISTRADOR' },
  // Inventario desactivado
  { section: 'Administración', path: '/permisos', label: 'Permisos y roles', permission: 'ASIGNAR PERMISOS' },
];

const ICONS: Record<string, ReactNode> = {
  dashboard: <HomeIcon className="w-5 h-5" />,
  programas: <BookOpenIcon className="w-5 h-5" />,
  fichas: <DocumentTextIcon className="w-5 h-5" />,
  instructores: <BriefcaseIcon className="w-5 h-5" />,
  aprendices: <UserGroupIcon className="w-5 h-5" />,
  personas: <UsersIcon className="w-5 h-5" />,
  asistencia: <ClipboardDocumentListIcon className="w-5 h-5" />,
  'asistencia/dashboard': <ChartBarIcon className="w-5 h-5" />,
  inventario: <CubeIcon className="w-5 h-5" />,
  'inventario/dashboard': <CubeIcon className="w-5 h-5" />,
  'inventario/productos': <CubeIcon className="w-5 h-5" />,
  'inventario/ordenes': <ShoppingCartIcon className="w-5 h-5" />,
  'inventario/ordenes/pendientes': <ClockIcon className="w-5 h-5" />,
  'inventario/devoluciones': <ArrowUturnLeftIcon className="w-5 h-5" />,
  permisos: <ShieldCheckIcon className="w-5 h-5" />,
};

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout, hasPermission, permissions, roles } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordNuevaConfirm, setPasswordNuevaConfirm] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Evitar scroll del body cuando el drawer está abierto (móvil)
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [sidebarOpen]);

  const visibleItems = SIDEBAR_ITEMS.filter((item) => {
    if (item.roleRequired) {
      if (!roles.includes(item.roleRequired)) return false;
    }
    return item.permission === null || hasPermission(item.permission);
  });
  const sections = Array.from(new Set(visibleItems.map((i) => i.section)));
  // #region agent log
  const hasVerAsistencia = hasPermission('VER ASISTENCIA');
  fetch('http://127.0.0.1:7880/ingest/64fbceb3-b0b0-4487-afc9-1084e1fd5a3f', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c9d35e' }, body: JSON.stringify({ sessionId: 'c9d35e', location: 'Layout.tsx:sidebar', message: 'sidebar permissions and VER ASISTENCIA', data: { permissionsLength: permissions.length, permissions: permissions, hasVerAsistencia, visiblePaths: visibleItems.map((i) => i.path) }, hypothesisId: 'H2-H5', timestamp: Date.now() }) }).catch(() => {});
  // #endregion

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openChangePassword = () => {
    setChangePasswordOpen(true);
    setPasswordActual('');
    setPasswordNueva('');
    setPasswordNuevaConfirm('');
    setChangePasswordError('');
    setChangePasswordSuccess('');
  };

  const closeChangePassword = () => {
    setChangePasswordOpen(false);
    setChangePasswordError('');
    setChangePasswordSuccess('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');
    if (passwordNueva.length < 6) {
      setChangePasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (passwordNueva !== passwordNuevaConfirm) {
      setChangePasswordError('La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    setChangePasswordLoading(true);
    try {
      await apiService.changePassword({
        password_actual: passwordActual,
        password_nueva: passwordNueva,
      });
      setChangePasswordSuccess('Contraseña actualizada correctamente.');
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordNuevaConfirm('');
      setTimeout(() => {
        closeChangePassword();
      }, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al cambiar la contraseña.';
      setChangePasswordError(msg);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Hamburger solo en móvil */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2.5 -ml-1 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                aria-label="Abrir menú"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              <Link to="/dashboard" className="flex items-center space-x-2" onClick={() => setSidebarOpen(false)}>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-sena-green rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">S</span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate max-w-[140px] sm:max-w-none">CDATTG Web</span>
              </Link>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2.5 sm:p-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors touch-manipulation min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
                title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
                aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-5 h-5 text-gray-700" />
                ) : (
                  <SunIcon className="w-5 h-5 text-yellow-300" />
                )}
              </button>
              {/* Usuario: en móvil solo avatar; en desktop nombre + avatar + acciones */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 dark:text-primary-300 font-semibold">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <button
                  type="button"
                  onClick={openChangePassword}
                  className="btn-secondary text-sm inline-flex items-center gap-2"
                  title="Cambiar contraseña"
                >
                  <KeyIcon className="w-4 h-4" />
                  Cambiar contraseña
                </button>
                <button onClick={handleLogout} className="btn-secondary text-sm">
                  Cerrar Sesión
                </button>
              </div>
              {/* En móvil: solo avatar (las acciones están en el drawer) */}
              <div className="md:hidden w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal cambiar contraseña */}
      {changePasswordOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeChangePassword}>
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <KeyIcon className="w-6 h-6" />
                Cambiar contraseña
              </h2>
              <button
                type="button"
                onClick={closeChangePassword}
                className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded"
                aria-label="Cerrar"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {changePasswordError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {changePasswordError}
                </div>
              )}
              {changePasswordSuccess && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                  {changePasswordSuccess}
                </div>
              )}
              <div>
                <label htmlFor="password_actual" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña actual *
                </label>
                <input
                  id="password_actual"
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="input-field w-full"
                  required
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label htmlFor="password_nueva" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nueva contraseña * (mín. 6 caracteres)
                </label>
                <input
                  id="password_nueva"
                  type="password"
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  className="input-field w-full"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="password_nueva_confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar nueva contraseña *
                </label>
                <input
                  id="password_nueva_confirm"
                  type="password"
                  value={passwordNuevaConfirm}
                  onChange={(e) => setPasswordNuevaConfirm(e.target.value)}
                  className="input-field w-full"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeChangePassword} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={changePasswordLoading}>
                  {changePasswordLoading ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backdrop del drawer (solo móvil) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-hidden
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex">
        {/* Sidebar: en móvil es drawer; en desktop siempre visible */}
        <aside
          className={`
            w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700
            min-h-screen md:min-h-[calc(100vh-4rem)]
            fixed md:static inset-y-0 left-0 z-50 md:z-auto
            transform transition-transform duration-200 ease-out md:transform-none
            flex flex-col
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          {/* Botón cerrar drawer (solo móvil) */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
            <span className="font-semibold text-gray-900 dark:text-white">Menú</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
              aria-label="Cerrar menú"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {sections.map((section, sectionIndex) => (
              <div key={section} className={sectionIndex > 0 ? 'mt-4' : ''}>
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section}
                </p>
                {visibleItems
                  .filter((item) => item.section === section)
                  .map((item) => {
                    const isActive =
                      item.path === '/dashboard'
                        ? location.pathname === '/dashboard'
                        : location.pathname === item.path ||
                          (location.pathname.startsWith(item.path + '/') &&
                            !visibleItems.some(
                              (other) => other.path !== item.path && other.path.startsWith(item.path + '/') && location.pathname.startsWith(other.path)
                            ));
                    const iconKey = item.path.slice(1); // e.g. "asistencia/dashboard" or "dashboard"
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`${navLinkClass(isActive)} min-h-[44px] md:min-h-0`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        {ICONS[iconKey] ?? ICONS[iconKey.split('/')[0]] ?? ICONS.dashboard}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
              </div>
            ))}
          </nav>

          {/* Bloque usuario en drawer (solo móvil): Cambiar contraseña + Cerrar sesión */}
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { openChangePassword(); setSidebarOpen(false); }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-medium touch-manipulation"
            >
              <KeyIcon className="w-5 h-5" />
              Cambiar contraseña
            </button>
            <button
              type="button"
              onClick={() => { handleLogout(); setSidebarOpen(false); }}
              className="w-full py-3 px-4 rounded-lg btn-secondary touch-manipulation"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 dark:bg-gray-900 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
