import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
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

function StatCard({
  label,
  value,
  hint,
}: Readonly<{ label: string; value: string; hint?: string }>) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm dark:border-gray-600 dark:bg-gray-800/80">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold leading-tight text-gray-900 dark:text-white sm:text-xl">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
}

function mesBloquesHint(loading: boolean, minutosMes: number, cantidadBloques: number): string | undefined {
  if (loading || minutosMes <= 0) return undefined;
  const etiqueta = cantidadBloques === 1 ? 'bloque' : 'bloques';
  return `${cantidadBloques} ${etiqueta} en el mes`;
}

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
  const mesHint = mesBloquesHint(loading, minutosMes, eventosMes.length);

  return (
    <div className="page-container flex h-[calc(100dvh-10.5rem)] min-h-[28rem] flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Mi programación</h1>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            Calendario semanal · horario <span className="font-medium">{gridRangeLabel}</span>
          </p>
          {error && (
            <p role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            to={asistenciaPaths.fichas}
            className="btn-primary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
          >
            <CalendarDaysIcon className="h-4 w-4" aria-hidden />
            Tomar asistencia
          </Link>
          <Link
            to={fichasPaths.index}
            className="btn-secondary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
          >
            <AcademicCapIcon className="h-4 w-4" aria-hidden />
            Mis fichas
          </Link>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard label="Clases esta semana" value={loading ? '…' : String(clasesSemana)} />
        <StatCard
          label="Horas esta semana"
          value={loading ? '…' : formatHorasProgramadas(minutosSemana)}
          hint={!loading && minutosSemana > 0 ? 'Según bloques programados' : undefined}
        />
        <StatCard
          label={`Horas en ${mesLabel}`}
          value={loading ? '…' : formatHorasProgramadas(minutosMes)}
          hint={mesHint}
        />
        <StatCard label="Fichas esta semana" value={loading ? '…' : String(fichasUnicas)} />
      </div>

      <WeekScheduleCalendar
        events={eventos}
        weekStart={weekStart}
        onWeekChange={setWeekStart}
        mode="instructor"
        loading={loading}
        fillViewport
      />
    </div>
  );
}
