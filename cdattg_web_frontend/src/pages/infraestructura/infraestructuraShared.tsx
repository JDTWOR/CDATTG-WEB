import { Link } from 'react-router-dom';

const BASE = '/infraestructura';

export const INFRAESTRUCTURA_NAV = [
  { path: `${BASE}/sedes`, label: 'Sedes' },
  { path: `${BASE}/bloques`, label: 'Bloques' },
  { path: `${BASE}/pisos`, label: 'Pisos' },
  { path: `${BASE}/ambientes`, label: 'Ambientes de formación' },
] as const;

type InfraestructuraStatusBadgeProps = Readonly<{
  activo: boolean;
  activoLabel?: string;
  inactivoLabel?: string;
}>;

export function InfraestructuraStatusBadge({
  activo,
  activoLabel = 'Activa',
  inactivoLabel = 'Inactiva',
}: InfraestructuraStatusBadgeProps) {
  return (
    <span
      className={
        activo
          ? 'inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : 'inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      }
    >
      {activo ? activoLabel : inactivoLabel}
    </span>
  );
}

export function InfraestructuraErrorAlert({ message }: Readonly<{ message: string }>) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
    >
      {message}
    </div>
  );
}

type InfraestructuraSubnavProps = Readonly<{ currentPath: string }>;

export function InfraestructuraSubnav({ currentPath }: InfraestructuraSubnavProps) {
  return (
    <nav aria-label="Módulos de infraestructura" className="flex flex-wrap gap-2">
      {INFRAESTRUCTURA_NAV.map((item) => {
        const active = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={
              active
                ? 'rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white'
                : 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
