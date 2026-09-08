/**
 * Cabecera de Mi perfil con foto o letra, nombre y roles.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { formatRoleLabel } from '../../utils/roles';
import { PerfilFotoAvatar } from './PerfilFotoAvatar';
import type { UserResponse } from '../../types';

type PerfilHeroSectionProps = Readonly<{
  loading: boolean;
  fullName: string;
  email: string;
  initial: string;
  user: UserResponse | null;
  roles: string[];
  tieneFoto?: boolean;
}>;

/**
 * Pinto la franja verde del perfil.
 */
export function PerfilHeroSection({
  loading,
  fullName,
  email,
  initial,
  user,
  roles,
  tieneFoto,
}: PerfilHeroSectionProps) {
  const displayName = loading && !fullName ? 'Cargando…' : fullName || 'Usuario sin nombre';
  const statusActive = Boolean(user?.status);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-4 pb-8 pt-6 sm:px-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-5 sm:text-left">
          <PerfilFotoAvatar initial={initial} tieneFoto={tieneFoto} />
          <div className="mt-4 min-w-0 sm:mt-0 sm:pb-1">
            <h2 className="text-xl font-bold leading-tight text-white sm:text-2xl">{displayName}</h2>
            {email ? <p className="mt-1 break-all text-sm text-primary-100">{email}</p> : null}
            <span
              className={`mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                statusActive
                  ? 'bg-emerald-500/25 text-emerald-50 ring-1 ring-emerald-300/50'
                  : 'bg-red-500/25 text-red-50 ring-1 ring-red-300/50'
              }`}
            >
              {statusActive ? 'Usuario activo' : 'Usuario inactivo'}
            </span>
          </div>
        </div>
      </div>
      {roles.length > 0 ? (
        <div className="border-t border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <ShieldCheckIcon className="h-4 w-4" />
            Roles
          </p>
          <ul className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {roles.map((rol) => (
              <li
                key={rol}
                className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 dark:bg-primary-900/50 dark:text-primary-200"
              >
                {formatRoleLabel(rol)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
