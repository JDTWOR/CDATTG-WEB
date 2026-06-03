import type { ReactNode } from 'react';
import {
  AcademicCapIcon,
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

type Props = Readonly<{
  ficha: FichaCaracterizacionResponse;
  /** Muestra badge Activa/Inactiva (listado admin). */
  showStatusBadge?: boolean;
  /** Muestra hora_inicio–hora_fin del día actual si la ficha tiene clase hoy. */
  showHorarioHoy?: boolean;
  /** Contenido bajo la info académica (estado de sesión, métricas, etc.). */
  extra?: ReactNode;
  /** Reemplaza el contador de aprendices en el pie izquierdo. */
  footerLeft?: ReactNode;
  /** Botones o enlaces del pie de la tarjeta (derecha). */
  actions?: ReactNode;
  className?: string;
}>;

export function FichaCaracterizacionCard({
  ficha,
  showStatusBadge = false,
  showHorarioHoy = false,
  extra,
  footerLeft,
  actions,
  className = '',
}: Props) {
  const sedeAmbiente = [ficha.sede_nombre, ficha.ambiente_nombre].filter(Boolean).join(' / ') || '–';
  const horarioHoy = showHorarioHoy ? getHorarioHoy(ficha) : null;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800 ${className}`}
    >
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold uppercase leading-tight text-gray-900 dark:text-white">
            {ficha.programa_formacion_nombre || 'Sin programa'}
          </h3>
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
        </div>

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
              {ficha.instructor_nombre || '–'}
            </div>
          </div>
        </div>

        {extra ? <div className="mb-4 space-y-3 border-t border-gray-100 pt-4 dark:border-gray-700">{extra}</div> : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
          {footerLeft ?? (
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <UsersIcon className="h-4 w-4 text-gray-400" />
              {ficha.cantidad_aprendices} Aprendices
            </span>
          )}
          {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}
