import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { type SidebarManifestItem } from '../../navigation/sidebar';
import { LayoutBrandLink } from './LayoutBrandLink';

type SidebarItem = SidebarManifestItem;

const navLinkClass = (isActive: boolean) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
    isActive
      ? 'border-l-[3px] border-primary-600 bg-primary-50 pl-[9px] font-medium text-primary-800 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-200'
      : 'border-l-[3px] border-transparent pl-[9px] text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/80'
  }`;

function isNavItemActive(pathname: string, item: SidebarItem, items: SidebarItem[]): boolean {
  if (item.path === '/dashboard') return pathname === '/dashboard';
  return (
    pathname === item.path ||
    (pathname.startsWith(item.path + '/') &&
      !items.some(
        (other) =>
          other.path !== item.path &&
          other.path.startsWith(item.path + '/') &&
          pathname.startsWith(other.path),
      ))
  );
}

function renderNavLink(
  item: SidebarItem,
  pathname: string,
  items: SidebarItem[],
  icons: Record<string, ReactNode>,
  onNavigate: () => void,
) {
  const isActive = isNavItemActive(pathname, item, items);
  const iconKey = item.iconKey;
  return (
    <Link
      key={item.path}
      to={item.path}
      className={`${navLinkClass(isActive)} min-h-[44px] md:min-h-0`}
      onClick={onNavigate}
    >
      {icons[iconKey] ?? icons[iconKey.split('/')[0]] ?? icons.dashboard}
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

type SidebarSectionGroupProps = Readonly<{
  section: string;
  sectionIndex: number;
  isExpanded: boolean;
  sectionHasActiveItem: boolean;
  sectionItems: SidebarItem[];
  pathname: string;
  visibleItems: SidebarItem[];
  icons: Record<string, ReactNode>;
  onToggle: () => void;
  onNavigate: () => void;
}>;

function SidebarSectionGroup({
  section,
  sectionIndex,
  isExpanded,
  sectionHasActiveItem,
  sectionItems,
  pathname,
  visibleItems,
  icons,
  onToggle,
  onNavigate,
}: SidebarSectionGroupProps) {
  return (
    <div className={sectionIndex > 0 ? 'pt-1' : ''}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full touch-manipulation items-center justify-between rounded-md px-2 py-2 text-left text-xs font-semibold transition-colors ${
          sectionHasActiveItem
            ? 'text-primary-700 dark:text-primary-300'
            : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
        }`}
        aria-expanded={isExpanded}
      >
        <span>{section}</span>
        {isExpanded ? (
          <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        ) : (
          <ChevronRightIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        )}
      </button>
      {isExpanded ? (
        <div className="mt-0.5 space-y-0.5">
          {sectionItems.map((item) => renderNavLink(item, pathname, visibleItems, icons, onNavigate))}
        </div>
      ) : null}
    </div>
  );
}

export type LayoutSidebarProps = Readonly<{
  sidebarOpen: boolean;
  sidebarHidden: boolean;
  brandPath: string;
  pathname: string;
  visibleItems: SidebarItem[];
  primaryItems: SidebarItem[];
  groupedSections: string[];
  expandedSection: string | null;
  icons: Record<string, ReactNode>;
  onClose: () => void;
  onHide: () => void;
  onShowDocked: () => void;
  onSectionToggle: (section: string) => void;
}>;

export function LayoutSidebar({
  sidebarOpen,
  sidebarHidden,
  brandPath,
  pathname,
  visibleItems,
  primaryItems,
  groupedSections,
  expandedSection,
  icons,
  onClose,
  onHide,
  onShowDocked,
  onSectionToggle,
}: LayoutSidebarProps) {
  return (
    <aside
      className={`
            app-sidebar fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-64
            transform flex-col border-r border-gray-200 bg-white shadow-sm transition-transform duration-200 ease-out
            dark:border-gray-700 dark:bg-gray-800
            ${sidebarHidden ? '' : 'md:static md:z-auto md:h-auto md:max-h-none md:min-h-[calc(100vh-3.5rem)]'}
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            ${sidebarHidden ? '' : 'md:translate-x-0'}
          `}
    >
      <div
        className={`sidebar-brand flex shrink-0 items-center gap-1 border-b border-black/20 bg-[#343a40] px-2 py-1 dark:border-white/10 ${sidebarHidden ? '' : 'md:flex'}`}
      >
        <LayoutBrandLink
          to={brandPath}
          variant="sidebar"
          className="min-w-0 flex-1 px-2 py-3"
          onClick={onClose}
        />
        <button
          type="button"
          onClick={onClose}
          className={`touch-manipulation rounded-md p-2 text-gray-300 hover:bg-white/10 hover:text-white ${sidebarHidden ? '' : 'md:hidden'}`}
          aria-label="Cerrar menú"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        {sidebarHidden ? null : (
          <button
            type="button"
            onClick={onHide}
            className="hidden rounded-md p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white md:inline-flex"
            title="Contraer menú"
            aria-label="Contraer menú"
          >
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {sidebarHidden ? (
        <div className="flex shrink-0 justify-end border-b border-gray-200 px-2 py-2 dark:border-gray-700 md:hidden">
          <button
            type="button"
            onClick={onShowDocked}
            className="touch-manipulation rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30"
            title="Mostrar menú"
            aria-label="Mostrar menú"
          >
            <ChevronDoubleRightIcon className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <nav className="sidebar-wrapper min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        {primaryItems.length > 0 ? (
          <div className="space-y-0.5">
            {primaryItems.map((item) => renderNavLink(item, pathname, visibleItems, icons, onClose))}
          </div>
        ) : null}

        {primaryItems.length > 0 && groupedSections.length > 0 ? (
          <div className="my-3 border-t border-gray-200 dark:border-gray-700" aria-hidden />
        ) : null}

        <div className="space-y-1">
          {groupedSections.map((section, sectionIndex) => {
            const sectionItems = visibleItems.filter((item) => item.section === section);
            return (
              <SidebarSectionGroup
                key={section}
                section={section}
                sectionIndex={sectionIndex}
                isExpanded={expandedSection === section}
                sectionHasActiveItem={sectionItems.some((item) =>
                  isNavItemActive(pathname, item, visibleItems),
                )}
                sectionItems={sectionItems}
                pathname={pathname}
                visibleItems={visibleItems}
                icons={icons}
                onToggle={() => onSectionToggle(section)}
                onNavigate={onClose}
              />
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

export function sectionForPathname(pathname: string, items: SidebarItem[]): string | null {
  for (const item of items) {
    if (isNavItemActive(pathname, item, items)) return item.section;
  }
  return items[0]?.section ?? null;
}
