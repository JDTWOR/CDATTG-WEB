import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { addDays, formatLocalISO, startOfWeekMonday } from './calendarUtils';

type WeekScheduleToolbarProps = Readonly<{
  weekStart: Date;
  onWeekChange: (start: Date) => void;
  compact?: boolean;
}>;

export function WeekScheduleToolbar({ weekStart, onWeekChange, compact = false }: WeekScheduleToolbarProps) {
  const weekEnd = addDays(weekStart, 6);
  const goToday = () => onWeekChange(startOfWeekMonday(new Date()));

  const barClass = compact
    ? 'flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-600'
    : 'flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-600 xl:px-6 xl:py-4 2xl:px-8';

  const navBtnClass = compact
    ? 'rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700'
    : 'rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 xl:p-2.5 2xl:p-3';

  const iconClass = compact ? 'h-4 w-4' : 'h-5 w-5 xl:h-6 xl:w-6';

  const rangeClass = compact
    ? 'text-xs font-medium text-gray-800 dark:text-gray-100 sm:text-sm'
    : 'text-sm font-medium text-gray-800 dark:text-gray-100 xl:text-base 2xl:text-lg';

  const todayBtnClass = compact ? 'btn-secondary px-3 py-1.5 text-xs' : 'btn-secondary text-sm xl:text-base 2xl:px-5 2xl:py-2.5';

  return (
    <div className={barClass}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={navBtnClass}
          onClick={() => onWeekChange(addDays(weekStart, -7))}
          aria-label="Semana anterior"
        >
          <ChevronLeftIcon className={iconClass} />
        </button>
        <button
          type="button"
          className={navBtnClass}
          onClick={() => onWeekChange(addDays(weekStart, 7))}
          aria-label="Semana siguiente"
        >
          <ChevronRightIcon className={iconClass} />
        </button>
        <span className={rangeClass}>
          {formatLocalISO(weekStart)} — {formatLocalISO(weekEnd)}
        </span>
      </div>
      <button type="button" className={todayBtnClass} onClick={goToday}>
        Semana actual
      </button>
    </div>
  );
}
