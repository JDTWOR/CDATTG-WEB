import type { ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

type Props = Readonly<{
  title: string;
  description: string;
  icon?: ReactNode;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}>;

export function AsistenciaCollapsibleCard({ title, description, icon, badge, open, onToggle, children }: Props) {
  const panelId = `asistencia-panel-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div
      className={`rounded-xl border bg-white shadow-sm dark:bg-gray-800 ${
        open ? 'border-primary-300 dark:border-primary-600' : 'border-gray-200 dark:border-gray-600'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left touch-manipulation"
      >
        {icon ? <span className="mt-0.5 shrink-0 text-primary-600 dark:text-primary-400">{icon}</span> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
            {badge ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
        <ChevronDownIcon
          className={`mt-1 h-5 w-5 shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-gray-700">
          {children}
        </div>
      ) : null}
    </div>
  );
}
