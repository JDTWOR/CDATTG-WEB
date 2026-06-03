import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import type { InstructorAgendaEvent } from '../../types/agenda';
import {
  addDays,
  colorClassForInstructor,
  eventsForDay,
  formatLocalISO,
  weekDaysFromStart,
  DAY_LABELS,
  startOfWeekMonday,
} from './calendarUtils';

type WeekScheduleCalendarProps = Readonly<{
  events: InstructorAgendaEvent[];
  weekStart: Date;
  onWeekChange: (start: Date) => void;
  mode: 'instructor' | 'ficha';
  loading?: boolean;
}>;

export function WeekScheduleCalendar({
  events,
  weekStart,
  onWeekChange,
  mode,
  loading,
}: WeekScheduleCalendarProps) {
  const days = weekDaysFromStart(weekStart);
  const weekEnd = addDays(weekStart, 6);
  const todayISO = formatLocalISO(new Date());

  const goToday = () => onWeekChange(startOfWeekMonday(new Date()));

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-600 px-4 py-3">
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

      {loading ? (
        <p className="p-8 text-center text-sm text-gray-500">Cargando programación…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-gray-600">
          {days.map((d, i) => {
            const iso = formatLocalISO(d);
            const isToday = iso === todayISO;
            const dayEvents = eventsForDay(events, iso);
            return (
              <div
                key={iso}
                className={`min-h-[8rem] p-2 ${isToday ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
              >
                <div
                  className={`mb-2 text-center text-xs font-semibold ${
                    isToday ? 'text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div>{DAY_LABELS[i]}</div>
                  <div className="text-lg">{d.getDate()}</div>
                </div>
                <div className="space-y-1.5">
                  {dayEvents.length === 0 ? (
                    <p className="text-[10px] text-center text-gray-400 py-4">—</p>
                  ) : (
                    dayEvents.map((ev) => {
                      const color = colorClassForInstructor(ev.instructor_id, mode);
                      return (
                        <div
                          key={`${ev.ficha_id}-${ev.hora_inicio}-${ev.instructor_id ?? 0}`}
                          className={`rounded border px-2 py-1.5 text-[11px] text-white ${color}`}
                        >
                          <div className="font-semibold">{ev.ficha_numero}</div>
                          <div className="opacity-90">
                            {ev.hora_inicio}–{ev.hora_fin}
                          </div>
                          {ev.programa_nombre && (
                            <div className="truncate opacity-80 text-[10px]">{ev.programa_nombre}</div>
                          )}
                          {mode === 'ficha' && ev.instructor_nombre && (
                            <div className="truncate opacity-80 text-[10px]">{ev.instructor_nombre}</div>
                          )}
                          {mode === 'instructor' && isToday && (
                            <Link
                              to={`/asistencia?ficha=${ev.ficha_id}`}
                              className="mt-1 block rounded bg-white/20 px-1 py-0.5 text-center text-[10px] hover:bg-white/30"
                            >
                              Tomar asistencia
                            </Link>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
