import { WeekScheduleCalendar } from '../../components/calendar/WeekScheduleCalendar';
import type { InstructorAgendaEvent } from '../../types/agenda';

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
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Programación instructores</h2>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <WeekScheduleCalendar
        events={events}
        weekStart={weekStart}
        onWeekChange={onWeekChange}
        mode="ficha"
        loading={loading}
      />
    </div>
  );
}
