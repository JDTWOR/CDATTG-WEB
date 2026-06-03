import { Link, useLocation, useMatches } from 'react-router-dom';
import {
  crumbsFromMatches,
  useBreadcrumbOverrides,
  type AppUiMatch,
} from '../../navigation/breadcrumb';

const HIDE_PREFIXES = ['/login'];

export function AppBreadcrumb() {
  const { pathname } = useLocation();
  const overrides = useBreadcrumbOverrides();
  const matches = useMatches() as AppUiMatch[];

  const hidden = HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const crumbs = crumbsFromMatches(matches, overrides);

  if (hidden || !crumbs.length) return null;

  return (
    <nav aria-label="Miga de pan" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const key = `${crumb.label}-${index}`;

          return (
            <li key={key} className="inline-flex items-center gap-2">
              {index !== 0 && (
                <span aria-hidden className="text-gray-400 dark:text-gray-500">
                  /
                </span>
              )}
              {isLast || !crumb.to ? (
                <span
                  className="font-medium text-gray-900 dark:text-white"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
