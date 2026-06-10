import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { asistenciaPaths, fichasPaths } from '../../routes/paths';
import { WeekScheduleCalendar } from '../../components/calendar/WeekScheduleCalendar';
import {
  computeGridTimeRangeFromEvents,
  formatGridRangeLabel,
  formatHorasProgramadas,
  formatMesAnioLabel,
  totalMinutosProgramados,
} from '../../components/calendar/calendarUtils';
import { useInstructorAgenda, useInitialWeekStart } from './useInstructorAgenda';

export function InstructorDashboardPage() {
  const [weekStart, setWeekStart] = useInitialWeekStart();
  const { data, monthData, loading, error } = useInstructorAgenda(weekStart);
  const eventos = data?.eventos ?? [];
  const eventosMes = monthData?.eventos ?? [];
  const clasesSemana = eventos.length;
  const fichasUnicas = new Set(eventos.map((e) => e.ficha_id)).size;
  const minutosSemana = useMemo(() => totalMinutosProgramados(eventos), [eventos]);
  const minutosMes = useMemo(() => totalMinutosProgramados(eventosMes), [eventosMes]);
  const mesLabel = useMemo(() => formatMesAnioLabel(weekStart), [weekStart]);
  const gridRangeLabel = useMemo(
    () => formatGridRangeLabel(computeGridTimeRangeFromEvents(eventos)),
    [eventos],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi programación</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Calendario semanal · horario <span className="font-medium">{gridRangeLabel}</span>
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Clases esta semana</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '…' : clasesSemana}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 shrink-0" aria-hidden />
            Horas esta semana
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? '…' : formatHorasProgramadas(minutosSemana)}
          </p>
          {!loading && minutosSemana > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Según bloques programados</p>
          )}
        </div>
        <div className="card">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 shrink-0" aria-hidden />
            Horas en {mesLabel}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? '…' : formatHorasProgramadas(minutosMes)}
          </p>
          {!loading && minutosMes > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {eventosMes.length} {eventosMes.length === 1 ? 'bloque' : 'bloques'} en el mes
            </p>
          )}
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Fichas esta semana</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '…' : fichasUnicas}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to={asistenciaPaths.fichas} className="btn-primary inline-flex items-center justify-center gap-2 text-sm">
            <CalendarDaysIcon className="h-5 w-5" aria-hidden />
            Tomar asistencia
          </Link>
          <Link to={fichasPaths.index} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
            <AcademicCapIcon className="h-5 w-5" aria-hidden />
            Mis fichas
          </Link>
        </div>
      </div>

      <WeekScheduleCalendar
        events={eventos}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        mode="instructor"
        loading={loading}
      />
    </div>
  );
}
