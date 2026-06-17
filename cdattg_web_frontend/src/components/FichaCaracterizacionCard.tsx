import { useState, type ReactNode } from 'react';
import {
  AcademicCapIcon,
  ChevronDownIcon,
  ClockIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { LABEL_INSTRUCTOR_LIDER } from '../constants/instructorLiderLabels';
import type { FichaCaracterizacionResponse } from '../types';
import { getHorarioHoy } from '../utils/fichaHorario';
import { toDisplayTitle } from '../utils/fichaListDisplay';

type Props = Readonly<{
  ficha: FichaCaracterizacionResponse;
  /** Muestra badge Activa/Inactiva (listado admin). */
  showStatusBadge?: boolean;
  /** Muestra hora_inicio–hora_fin del día actual si la ficha tiene clase hoy. */
  showHorarioHoy?: boolean;
  /** Si se define, reemplaza el horario derivado de dias_formacion (p. ej. agenda del instructor). */
  horarioHoyLabel?: string | null;
  /** Contenido bajo la info académica (estado de sesión, métricas, etc.). */
  extra?: ReactNode;
  /** Reemplaza el contador de aprendices en el pie izquierdo. */
  footerLeft?: ReactNode;
  /** Botones o enlaces del pie de la tarjeta (derecha). */
  actions?: ReactNode;
  /** Permite colapsar el contenido (sesión de asistencia). */
  collapsible?: boolean;
  /** Estado inicial al usar `collapsible`. */
  defaultOpen?: boolean;
  className?: string;
}>;

function FichaCardHeaderBadges({
  ficha,
  showStatusBadge,
}: Readonly<{ ficha: FichaCaracterizacionResponse; showStatusBadge: boolean }>) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {showStatusBadge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            ficha.status
              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
          }`}
        >
          {ficha.status ? 'Activa' : 'Inactiva'}
        </span>
      ) : null}
      {ficha.modalidad_formacion_nombre ? (
        <span className="rounded bg-primary-600 px-2.5 py-1 text-xs font-medium text-white">
          {ficha.modalidad_formacion_nombre}
        </span>
      ) : null}
    </div>
  );
}

function FichaCardExpandedContent({
  ficha,
  horarioHoy,
  sedeAmbiente,
  extra,
  footerLeft,
  actions,
}: Readonly<{
  ficha: FichaCaracterizacionResponse;
  horarioHoy: string | null;
  sedeAmbiente: string;
  extra?: ReactNode;
  footerLeft?: ReactNode;
  actions?: ReactNode;
}>) {
  return (
    <>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Ficha {ficha.ficha}</p>

      <div className="mb-4 space-y-3">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            <AcademicCapIcon className="h-4 w-4 text-gray-400" />
            Información académica
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Cog6ToothIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <span>Jornada: {ficha.jornada_nombre || '–'}</span>
          </div>
          {horarioHoy ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <ClockIcon className="h-4 w-4 shrink-0 text-gray-400" />
              <span>Hora (hoy): {horarioHoy}</span>
            </div>
          ) : null}
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <MapPinIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <span>Sede / Ambiente: {sedeAmbiente}</span>
          </div>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            <ComputerDesktopIcon className="h-4 w-4 text-gray-400" />
            {LABEL_INSTRUCTOR_LIDER}
          </p>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <UserIcon className="h-4 w-4 shrink-0 text-gray-400" />
                  {toDisplayTitle(ficha.instructor_nombre)}
                </div>
        </div>
      </div>

      {extra ? (
        <div className="mb-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700">{extra}</div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
        {footerLeft ?? (
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <UsersIcon className="h-4 w-4 text-gray-400" />
            {ficha.cantidad_aprendices} Aprendices
          </span>
        )}
        {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
      </div>
    </>
  );
}

function FichaCardCollapsibleHeader({
  open,
  onToggle,
  fichaNumero,
  headerTitle,
  headerBadges,
}: Readonly<{
  open: boolean;
  onToggle: () => void;
  fichaNumero: string;
  headerTitle: ReactNode;
  headerBadges: ReactNode;
}>) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="-m-1 mb-1 flex w-full cursor-pointer items-start justify-between gap-2 rounded-lg p-1 text-left touch-manipulation"
      >
        <div className="min-w-0 flex-1">{headerTitle}</div>
        <div className="flex shrink-0 items-start gap-2">
          {headerBadges}
          <ChevronDownIcon
            className={`mt-0.5 h-5 w-5 shrink-0 text-gray-500 transition-transform dark:text-gray-400 ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
        </div>
      </button>
      {open ? null : (
        <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">Ficha {fichaNumero}</p>
      )}
    </>
  );
}

export function FichaCaracterizacionCard({
  ficha,
  showStatusBadge = false,
  showHorarioHoy = false,
  horarioHoyLabel,
  extra,
  footerLeft,
  actions,
  collapsible = false,
  defaultOpen = true,
  className = '',
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const sedeAmbiente = [ficha.sede_nombre, ficha.ambiente_nombre].filter(Boolean).join(' / ') || '–';
  let horarioHoy: string | null = null;
  if (showHorarioHoy) {
    horarioHoy = horarioHoyLabel === undefined ? getHorarioHoy(ficha) : horarioHoyLabel;
  }
  const expanded = !collapsible || open;
  const borderClass =
    collapsible && open ? 'border-primary-300 dark:border-primary-600' : 'border-gray-200 dark:border-gray-600';

  const headerTitle = (
    <h3 className="text-sm font-bold leading-tight text-gray-900 dark:text-white">
      {toDisplayTitle(ficha.programa_formacion_nombre) || 'Sin programa'}
    </h3>
  );
  const headerBadges = <FichaCardHeaderBadges ficha={ficha} showStatusBadge={showStatusBadge} />;

  return (
    <div className={`overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-gray-800 ${borderClass} ${className}`}>
      <div className="p-5">
        {collapsible ? (
          <FichaCardCollapsibleHeader
            open={open}
            onToggle={() => setOpen((prev) => !prev)}
            fichaNumero={ficha.ficha}
            headerTitle={headerTitle}
            headerBadges={headerBadges}
          />
        ) : (
          <div className="mb-3 flex items-start justify-between gap-2">
            {headerTitle}
            {headerBadges}
          </div>
        )}

        {expanded ? (
          <FichaCardExpandedContent
            ficha={ficha}
            horarioHoy={horarioHoy}
            sedeAmbiente={sedeAmbiente}
            extra={extra}
            footerLeft={footerLeft}
            actions={actions}
          />
        ) : null}
      </div>
    </div>
  );
}
