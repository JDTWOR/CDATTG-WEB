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
    <div className="page-container space-y-6 xl:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white xl:text-3xl 2xl:text-4xl">
            Mi programación
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 xl:text-base 2xl:text-lg">
            Calendario semanal · horario <span className="font-medium">{gridRangeLabel}</span>
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400 xl:text-base">
              {error}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <Link
            to={asistenciaPaths.fichas}
            className="btn-primary inline-flex items-center justify-center gap-2 text-sm xl:text-base 2xl:px-6 2xl:py-3"
          >
            <CalendarDaysIcon className="h-5 w-5 xl:h-6 xl:w-6" aria-hidden />
            Tomar asistencia
          </Link>
          <Link
            to={fichasPaths.index}
            className="btn-secondary inline-flex items-center justify-center gap-2 text-sm xl:text-base 2xl:px-6 2xl:py-3"
          >
            <AcademicCapIcon className="h-5 w-5 xl:h-6 xl:w-6" aria-hidden />
            Mis fichas
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6">
        <div className="card xl:p-7 2xl:p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 xl:text-base">Clases esta semana</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white xl:text-3xl 2xl:text-4xl">
            {loading ? '…' : clasesSemana}
          </p>
        </div>
        <div className="card xl:p-7 2xl:p-8">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 xl:text-base">
            <ClockIcon className="h-4 w-4 shrink-0 xl:h-5 xl:w-5" aria-hidden />
            Horas esta semana
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white xl:text-3xl 2xl:text-4xl">
            {loading ? '…' : formatHorasProgramadas(minutosSemana)}
          </p>
          {!loading && minutosSemana > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 xl:text-sm">Según bloques programados</p>
          )}
        </div>
        <div className="card xl:p-7 2xl:p-8">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 xl:text-base">
            <ClockIcon className="h-4 w-4 shrink-0 xl:h-5 xl:w-5" aria-hidden />
            Horas en {mesLabel}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white xl:text-3xl 2xl:text-4xl">
            {loading ? '…' : formatHorasProgramadas(minutosMes)}
          </p>
          {!loading && minutosMes > 0 && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 xl:text-sm">
              {eventosMes.length} {eventosMes.length === 1 ? 'bloque' : 'bloques'} en el mes
            </p>
          )}
        </div>
        <div className="card xl:p-7 2xl:p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 xl:text-base">Fichas esta semana</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white xl:text-3xl 2xl:text-4xl">
            {loading ? '…' : fichasUnicas}
          </p>
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
