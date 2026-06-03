import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { addDays, formatLocalISO, startOfWeekMonday } from './calendarUtils';

type WeekScheduleToolbarProps = Readonly<{
  weekStart: Date;
  onWeekChange: (start: Date) => void;
}>;

export function WeekScheduleToolbar({ weekStart, onWeekChange }: WeekScheduleToolbarProps) {
  const weekEnd = addDays(weekStart, 6);
  const goToday = () => onWeekChange(startOfWeekMonday(new Date()));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-600">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => onWeekChange(addDays(weekStart, -7))}
          aria-label="Semana anterior"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => onWeekChange(addDays(weekStart, 7))}
          aria-label="Semana siguiente"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {formatLocalISO(weekStart)} — {formatLocalISO(weekEnd)}
        </span>
      </div>
      <button type="button" className="btn-secondary text-sm" onClick={goToday}>
        Semana actual
      </button>
    </div>
  );
}
