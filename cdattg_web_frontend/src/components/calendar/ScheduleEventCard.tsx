import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { InstructorAgendaEvent } from '../../types/agenda';
import { asistenciaFichaPath } from '../../pages/asistencia/asistenciaPaths';
import { colorClassForInstructor } from './calendarUtils';

type ScheduleEventCardProps = Readonly<{
  event: InstructorAgendaEvent;
  mode: 'instructor' | 'ficha';
  isToday: boolean;
  style?: CSSProperties;
  className?: string;
}>;

export function ScheduleEventCard({
  event,
  mode,
  isToday,
  style,
  className = '',
}: ScheduleEventCardProps) {
  const color = colorClassForInstructor(event.instructor_id, mode);

  return (
    <div
      className={`absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border px-1.5 py-1 text-[10px] leading-tight text-white ${color} ${className}`}
      style={style}
      title={`${event.ficha_numero} ${event.hora_inicio}–${event.hora_fin}`}
    >
      <div className="truncate font-semibold">{event.ficha_numero}</div>
      <div className="truncate opacity-90">
        {event.hora_inicio}–{event.hora_fin}
      </div>
      {event.programa_nombre && (
        <div className="truncate opacity-80 text-[9px]">{event.programa_nombre}</div>
      )}
      {mode === 'ficha' && event.instructor_nombre && (
        <div className="truncate opacity-80 text-[9px]">{event.instructor_nombre}</div>
      )}
      {mode === 'instructor' && isToday && (
        <Link
          to={asistenciaFichaPath(event.ficha_id)}
          className="mt-0.5 block rounded bg-white/20 px-1 py-0.5 text-center text-[9px] hover:bg-white/30"
          onClick={(e) => e.stopPropagation()}
        >
          Tomar asistencia
        </Link>
      )}
    </div>
  );
}
