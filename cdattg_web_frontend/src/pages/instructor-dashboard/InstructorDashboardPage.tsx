import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { asistenciaPaths, fichasPaths } from '../../routes/paths';
import { WeekScheduleCalendar } from '../../components/calendar/WeekScheduleCalendar';
import { computeGridTimeRangeFromEvents, formatGridRangeLabel } from '../../components/calendar/calendarUtils';
import { useInstructorAgenda, useInitialWeekStart } from './useInstructorAgenda';

export function InstructorDashboardPage() {
  const [weekStart, setWeekStart] = useInitialWeekStart();
  const { data, loading, error } = useInstructorAgenda(weekStart);
  const eventos = data?.eventos ?? [];
  const clasesSemana = eventos.length;
  const fichasUnicas = new Set(eventos.map((e) => e.ficha_id)).size;
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Clases esta semana</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '…' : clasesSemana}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Fichas activas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '…' : fichasUnicas}</p>
        </div>
        <div className="card flex flex-col justify-center gap-2">
          <Link to={asistenciaPaths.index} className="btn-primary inline-flex items-center justify-center gap-2 text-sm">
            <CalendarDaysIcon className="h-5 w-5" />
            Tomar asistencia
          </Link>
          <Link to={fichasPaths.index} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
            <AcademicCapIcon className="h-5 w-5" />
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
