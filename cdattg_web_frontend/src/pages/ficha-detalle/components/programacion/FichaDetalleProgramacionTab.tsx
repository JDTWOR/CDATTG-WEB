import { WeekScheduleCalendar } from '../../../../components/calendar/WeekScheduleCalendar';
import { colorClassForInstructor, uniqueInstructorsFromEvents } from '../../../../components/calendar/calendarUtils';
import type { InstructorAgendaEvent } from '../../../../types/agenda';

type FichaDetalleProgramacionTabProps = Readonly<{
  events: InstructorAgendaEvent[];
  weekStart: Date;
  onWeekChange: (d: Date) => void;
  loading: boolean;
  error: string;
}>;

export function FichaDetalleProgramacionTab({
  events,
  weekStart,
  onWeekChange,
  loading,
  error,
}: FichaDetalleProgramacionTabProps) {
  const instructores = uniqueInstructorsFromEvents(events);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Programación instructores</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Vista semanal · horario <span className="font-medium">06:00–24:00</span>
        </p>
      </div>

      {instructores.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2 text-xs dark:border-gray-600 dark:bg-gray-900/40">
          <span className="font-medium text-gray-700 dark:text-gray-300">Instructores:</span>
          {instructores.map((ins) => (
            <span key={ins.id} className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <span
                className={`inline-block h-3 w-3 rounded border ${colorClassForInstructor(ins.id, 'ficha')}`}
                aria-hidden
              />
              {ins.nombre}
            </span>
          ))}
        </div>
      )}

      <WeekScheduleCalendar
        events={events}
        weekStart={weekStart}
        onWeekChange={onWeekChange}
        mode="ficha"
        loading={loading}
        error={error || undefined}
      />
    </div>
  );
}
