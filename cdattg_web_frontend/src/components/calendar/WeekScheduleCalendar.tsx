import { useMemo } from 'react';
import type { InstructorAgendaEvent } from '../../types/agenda';
import { buildInstructorColorMap, computeGridTimeRangeFromEvents } from './calendarUtils';
import { WeekScheduleTimeGrid } from './WeekScheduleTimeGrid';
import { WeekScheduleToolbar } from './WeekScheduleToolbar';

type WeekScheduleCalendarProps = Readonly<{
  events: InstructorAgendaEvent[];
  weekStart: Date;
  onWeekChange: (start: Date) => void;
  mode: 'instructor' | 'ficha';
  loading?: boolean;
  error?: string;
  /** Ocupa el alto disponible del contenedor padre (dashboard instructor). */
  fillViewport?: boolean;
}>;

export function WeekScheduleCalendar({
  events,
  weekStart,
  onWeekChange,
  mode,
  loading,
  error,
  fillViewport = false,
}: WeekScheduleCalendarProps) {
  const gridRange = useMemo(
    () => computeGridTimeRangeFromEvents(events),
    [events],
  );

  const instructorColorMap = useMemo(
    () => (mode === 'ficha' ? buildInstructorColorMap(events) : undefined),
    [events, mode],
  );

  const shellClass = fillViewport
    ? 'flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800/80'
    : 'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800/80';

  return (
    <div className={shellClass}>
      <WeekScheduleToolbar weekStart={weekStart} onWeekChange={onWeekChange} compact={fillViewport} />
      {error && (
        <p className="border-b border-gray-200 px-4 py-2 text-sm text-red-600 dark:border-gray-600 dark:text-red-400">
          {error}
        </p>
      )}
      {loading ? (
        <p className="p-8 text-center text-sm text-gray-500">Cargando programación…</p>
      ) : (
        <WeekScheduleTimeGrid
          events={events}
          weekStart={weekStart}
          mode={mode}
          gridRange={gridRange}
          instructorColorMap={instructorColorMap}
          fillViewport={fillViewport}
        />
      )}
    </div>
  );
}
