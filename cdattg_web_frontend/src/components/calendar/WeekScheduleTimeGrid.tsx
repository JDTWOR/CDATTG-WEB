import type { InstructorAgendaEvent } from '../../types/agenda';
import { ScheduleEventCard } from './ScheduleEventCard';
import {
  DAY_LABELS,
  DEFAULT_GRID_RANGE,
  eventHeightPercent,
  eventTopPercent,
  eventsForDay,
  formatLocalISO,
  gridBodyHeightPx,
  hourTicksForRange,
  type GridTimeRange,
  weekDaysFromStart,
} from './calendarUtils';

type WeekScheduleTimeGridProps = Readonly<{
  events: InstructorAgendaEvent[];
  weekStart: Date;
  mode: 'instructor' | 'ficha';
  gridRange?: GridTimeRange;
  instructorColorMap?: Map<number, string>;
}>;

export function WeekScheduleTimeGrid({
  events,
  weekStart,
  mode,
  gridRange = DEFAULT_GRID_RANGE,
  instructorColorMap,
}: WeekScheduleTimeGridProps) {
  const days = weekDaysFromStart(weekStart);
  const todayISO = formatLocalISO(new Date());
  const hourTicks = hourTicksForRange(gridRange);
  const gridHeight = gridBodyHeightPx(gridRange);

  return (
    <div className="flex justify-center overflow-x-auto overflow-y-auto max-h-[min(70vh,52rem)] 2xl:max-h-[min(75vh,56rem)]">
      <div className="w-fit min-w-[48rem] max-w-full px-1 pb-1">
        <div className="schedule-grid-cols grid border-b border-gray-200 dark:border-gray-600">
          <div className="border-r border-gray-200 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-900/30" />
          {days.map((d, i) => {
            const iso = formatLocalISO(d);
            const isToday = iso === todayISO;
            return (
              <div
                key={iso}
                className={`border-r border-gray-200 px-1 py-2 text-center last:border-r-0 dark:border-gray-600 xl:px-2 xl:py-3 ${
                  isToday ? 'bg-primary-50/60 dark:bg-primary-900/15' : 'bg-gray-50/50 dark:bg-gray-900/20'
                }`}
              >
                <div
                  className={`text-xs font-semibold xl:text-sm 2xl:text-base ${
                    isToday ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {DAY_LABELS[i]}
                </div>
                <div
                  className={`text-lg font-bold xl:text-xl 2xl:text-2xl ${
                    isToday ? 'text-primary-800 dark:text-primary-200' : ''
                  }`}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="schedule-grid-cols grid"
          style={{
            height: gridHeight,
          }}
        >
          <div className="relative border-r border-gray-200 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-900/30">
            {hourTicks.map((tick) => (
              <div
                key={tick.hour}
                className="absolute right-1 -translate-y-1/2 text-[10px] font-medium text-gray-500 dark:text-gray-400 xl:text-xs 2xl:text-sm"
                style={{ top: `${tick.topPercent}%` }}
              >
                {tick.label}
              </div>
            ))}
          </div>

          {days.map((d) => {
            const iso = formatLocalISO(d);
            const isToday = iso === todayISO;
            const dayEvents = eventsForDay(events, iso);

            return (
              <div
                key={iso}
                className={`relative border-r border-gray-200 last:border-r-0 dark:border-gray-600 ${
                  isToday ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                }`}
              >
                {hourTicks.map((tick) => (
                  <div
                    key={tick.hour}
                    className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700/80"
                    style={{ top: `${tick.topPercent}%` }}
                  />
                ))}
                {dayEvents.map((ev) => (
                  <ScheduleEventCard
                    key={`${ev.ficha_id}-${ev.hora_inicio}-${ev.instructor_id ?? 0}-${ev.fecha}`}
                    event={ev}
                    mode={mode}
                    isToday={isToday}
                    instructorColorMap={instructorColorMap}
                    style={{
                      top: `${eventTopPercent(ev.hora_inicio, gridRange)}%`,
                      height: `${eventHeightPercent(ev.hora_inicio, ev.hora_fin, gridRange)}%`,
                      minHeight: '1.25rem',
                    }}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
