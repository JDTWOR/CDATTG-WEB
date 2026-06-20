import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';

type KpiCardProps = Readonly<{
  label: string;
  value: string | number;
  tooltip?: string;
  icon?: ReactNode;
  accentClass?: string;
}>;

export function KpiCard({ label, value, tooltip, icon, accentClass = 'bg-primary-100 dark:bg-primary-900/50' }: KpiCardProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
            <span className="truncate">{label}</span>
            {tooltip ? <InfoTooltip text={tooltip} /> : null}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{value}</p>
        </div>
        {icon ? (
          <div className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center ${accentClass}`}>{icon}</div>
        ) : null}
      </div>
    </div>
  );
}
