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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-600 xl:px-6 xl:py-4 2xl:px-8">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 xl:p-2.5 2xl:p-3"
          onClick={() => onWeekChange(addDays(weekStart, -7))}
          aria-label="Semana anterior"
        >
          <ChevronLeftIcon className="h-5 w-5 xl:h-6 xl:w-6" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 xl:p-2.5 2xl:p-3"
          onClick={() => onWeekChange(addDays(weekStart, 7))}
          aria-label="Semana siguiente"
        >
          <ChevronRightIcon className="h-5 w-5 xl:h-6 xl:w-6" />
        </button>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 xl:text-base 2xl:text-lg">
          {formatLocalISO(weekStart)} — {formatLocalISO(weekEnd)}
        </span>
      </div>
      <button type="button" className="btn-secondary text-sm xl:text-base 2xl:px-5 2xl:py-2.5" onClick={goToday}>
        Semana actual
      </button>
    </div>
  );
}
