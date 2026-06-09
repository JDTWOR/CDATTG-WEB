import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { InstructorAgendaEvent } from '../../types/agenda';
import { asistenciaFichaPath } from '../../pages/asistencia/asistenciaPaths';
import { colorClassForInstructor, extractHoraHHMM } from './calendarUtils';

type ScheduleEventCardProps = Readonly<{
  event: InstructorAgendaEvent;
  mode: 'instructor' | 'ficha';
  isToday: boolean;
  instructorColorMap?: Map<number, string>;
  style?: CSSProperties;
  className?: string;
}>;

function horarioEvento(event: InstructorAgendaEvent): string {
  const inicio = extractHoraHHMM(event.hora_inicio);
  const fin = extractHoraHHMM(event.hora_fin);
  if (!inicio || !fin) return '';
  return `${inicio}–${fin}`;
}

function buildEventTitle(event: InstructorAgendaEvent): string {
  const parts = [
    event.ficha_numero,
    horarioEvento(event),
    event.programa_nombre,
    event.instructor_nombre,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function ScheduleEventCard({
  event,
  mode,
  isToday,
  instructorColorMap,
  style,
  className = '',
}: ScheduleEventCardProps) {
  const color = colorClassForInstructor(event.instructor_id, mode, instructorColorMap);

  return (
    <div
      className={`absolute left-1 right-1 z-10 flex h-full flex-col gap-0.5 overflow-hidden rounded border px-2 py-1.5 text-xs leading-snug text-white ${color} ${className}`}
      style={style}
      title={buildEventTitle(event)}
    >
      {mode === 'ficha' ? (
        <>
          <div className="line-clamp-1 font-semibold">{horarioEvento(event)}</div>
          {event.instructor_nombre && (
            <div className="line-clamp-3 flex-1 opacity-90">{event.instructor_nombre}</div>
          )}
        </>
      ) : (
        <>
          <div className="line-clamp-2 font-semibold">{event.ficha_numero}</div>
          {event.programa_nombre && (
            <div className="line-clamp-2 flex-1 opacity-90">{event.programa_nombre}</div>
          )}
          {isToday && (
            <Link
              to={asistenciaFichaPath(event.ficha_id)}
              className="mt-auto block rounded bg-white/20 px-1 py-0.5 text-center text-[10px] hover:bg-white/30"
              onClick={(e) => e.stopPropagation()}
            >
              Tomar asistencia
            </Link>
          )}
        </>
      )}
    </div>
  );
}
