import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDownIcon, KeyIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { DASHBOARD_PATH, PERFIL_PATH } from '../../routes/paths';

type LayoutUserMenuProps = Readonly<{
  userName?: string;
  userEmail?: string;
  rolesLine: string;
  homePath: string;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}>;

function userInitial(name?: string): string {
  return name?.charAt(0).toUpperCase() ?? '?';
}

function userFirstName(name?: string): string {
  const part = name?.trim().split(/\s+/)[0];
  return part && part.length > 0 ? part : 'Usuario';
}

export function LayoutUserMenu({
  userName,
  userEmail,
  rolesLine,
  homePath,
  onOpenChangePassword,
  onLogout,
}: LayoutUserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = userInitial(userName);
  const firstName = userFirstName(userName);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex touch-manipulation items-center gap-2 rounded-lg px-2 py-1.5 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de usuario"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 shadow-sm ring-1 ring-primary-200/80 dark:bg-primary-900/60 dark:text-primary-200 dark:ring-primary-700/50">
          {initial}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium md:inline">{firstName}</span>
        <ChevronDownIcon
          className={`hidden h-4 w-4 shrink-0 opacity-70 transition-transform md:block ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {/* user-header — AdminLTE text-bg-primary */}
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-4 py-5 text-center text-white">
            <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl font-semibold shadow-md ring-2 ring-white/30">
              {initial}
            </span>
            <p className="truncate text-base font-semibold">{userName ?? 'Usuario'}</p>
            {rolesLine ? <p className="mt-0.5 truncate text-sm text-primary-100">{rolesLine}</p> : null}
            {userEmail ? (
              <p className="mt-1 truncate text-xs text-primary-200/90">{userEmail}</p>
            ) : null}
          </div>

          {/* user-body — accesos rápidos en 3 columnas */}
          <div className="border-b border-gray-100 px-2 py-3 dark:border-gray-700">
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700">
              <Link
                to={PERFIL_PATH}
                role="menuitem"
                className="flex flex-col items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                onClick={close}
              >
                <UserCircleIcon className="h-5 w-5" aria-hidden />
                Perfil
              </Link>
              <Link
                to={homePath || DASHBOARD_PATH}
                role="menuitem"
                className="flex flex-col items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                onClick={close}
              >
                <span className="text-lg leading-none" aria-hidden>
                  ⌂
                </span>
                Inicio
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex flex-col items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400"
                onClick={() => {
                  close();
                  onOpenChangePassword();
                }}
              >
                <KeyIcon className="h-5 w-5" aria-hidden />
                Contraseña
              </button>
            </div>
          </div>

          {/* user-footer — Profile + Sign out */}
          <div className="flex items-center justify-between gap-2 bg-gray-50 px-3 py-3 dark:bg-gray-900/40">
            <Link
              to={PERFIL_PATH}
              role="menuitem"
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={close}
            >
              Mi perfil
            </Link>
            <button
              type="button"
              role="menuitem"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-950/40"
              onClick={() => {
                close();
                onLogout();
              }}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden />
              Salir
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
