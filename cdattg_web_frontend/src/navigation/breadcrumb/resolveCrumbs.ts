import { DASHBOARD_PATH } from '../../routes/paths';
import type { AppUiMatch, BreadcrumbCrumb, BreadcrumbHandleValue } from './types';

const INICIO: BreadcrumbCrumb = { label: 'Inicio', to: DASHBOARD_PATH };

export function resolveBreadcrumbSegments(
  value: BreadcrumbHandleValue | undefined,
  params: Record<string, string | undefined>,
): BreadcrumbCrumb[] {
  if (!value) return [];
  const resolved = typeof value === 'function' ? value(params) : value;
  return Array.isArray(resolved) ? resolved : [resolved];
}

export function crumbsFromMatches(
  matches: AppUiMatch[],
  overrides: Record<string, string> = {},
): BreadcrumbCrumb[] {
  const segments = matches.flatMap((match) =>
    resolveBreadcrumbSegments(
      match.handle?.breadcrumb,
      (match.params ?? {}) as Record<string, string | undefined>,
    ),
  );

  if (segments.length === 0) {
    return [INICIO];
  }

  const crumbs = [INICIO, ...segments];
  const pathname = matches.at(-1)?.pathname ?? '';
  const override =
    overrides[pathname] ??
    Object.entries(overrides).find(([key]) => pathname === key || pathname.startsWith(`${key}/`))?.[1];

  if (!override) return crumbs;

  const next = [...crumbs];
  const last = next.at(-1);
  if (!last) return crumbs;
  next[next.length - 1] = { ...last, label: override };
  return next;
}
