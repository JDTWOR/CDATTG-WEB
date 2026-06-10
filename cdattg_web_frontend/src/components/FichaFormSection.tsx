import type { ReactNode } from 'react';

type Props = Readonly<{
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}>;

export function FichaFormSection({ title, description, icon, children, className = '' }: Props) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-600 dark:bg-gray-900/40 ${className}`}
    >
      <div className="mb-3 flex items-start gap-2">
        {icon ? <span className="mt-0.5 shrink-0 text-primary-600 dark:text-primary-400">{icon}</span> : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
