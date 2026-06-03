import type { UIMatch } from 'react-router-dom';

export type BreadcrumbCrumb = {
  label: string;
  to?: string;
};

export type BreadcrumbHandleValue =
  | BreadcrumbCrumb
  | BreadcrumbCrumb[]
  | ((params: Record<string, string | undefined>) => BreadcrumbCrumb | BreadcrumbCrumb[]);

export type AppRouteHandle = {
  breadcrumb?: BreadcrumbHandleValue;
};

export type AppUiMatch = UIMatch<unknown, AppRouteHandle>;
