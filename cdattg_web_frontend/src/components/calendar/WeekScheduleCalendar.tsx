import type { InstructorAgendaEvent } from '../../types/agenda';
import { WeekScheduleTimeGrid } from './WeekScheduleTimeGrid';
import { WeekScheduleToolbar } from './WeekScheduleToolbar';

type WeekScheduleCalendarProps = Readonly<{
  events: InstructorAgendaEvent[];
  weekStart: Date;
  onWeekChange: (start: Date) => void;
  mode: 'instructor' | 'ficha';
  loading?: boolean;
  error?: string;
}>;

export function WeekScheduleCalendar({
  events,
  weekStart,
  onWeekChange,
  mode,
  loading,
  error,
}: WeekScheduleCalendarProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800/80">
      <WeekScheduleToolbar weekStart={weekStart} onWeekChange={onWeekChange} />
      {error && (
        <p className="border-b border-gray-200 px-4 py-2 text-sm text-red-600 dark:border-gray-600 dark:text-red-400">
          {error}
        </p>
      )}
      {loading ? (
        <p className="p-8 text-center text-sm text-gray-500">Cargando programación…</p>
      ) : (
        <WeekScheduleTimeGrid events={events} weekStart={weekStart} mode={mode} />
      )}
    </div>
  );
}
