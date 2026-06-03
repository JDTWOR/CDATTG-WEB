import {
  AcademicCapIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClockIcon,
  ComputerDesktopIcon,
  MapPinIcon,
  SunIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { LABEL_INSTRUCTOR_LIDER } from '../../../constants/instructorLiderLabels';
import { formatFechaVista } from '../../../utils/formatFecha';
import type { FichaCaracterizacionResponse } from '../../../types';

type FichaDetalleResumenProps = Readonly<{
  ficha: FichaCaracterizacionResponse;
  diasLabel: string;
  puedeEditarFicha: boolean;
}>;

export function FichaDetalleResumen({ ficha, diasLabel, puedeEditarFicha }: FichaDetalleResumenProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Datos de la ficha</h2>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex gap-3">
          <BookOpenIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Programa</dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.programa_formacion_nombre || '—'}</dd>
          </div>
        </div>
        <div className="flex gap-3 sm:col-span-2 lg:col-span-1">
          <AcademicCapIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {LABEL_INSTRUCTOR_LIDER}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{ficha.instructor_nombre || '—'}</dd>
            {puedeEditarFicha && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Para cambiar el instructor líder u otros datos, use el botón «Editar ficha» en la parte superior.
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <MapPinIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Sede</dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.sede_nombre ?? '—'}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <ComputerDesktopIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Ambiente</dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.ambiente_nombre ?? '—'}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <BuildingOffice2Icon className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Modalidad</dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.modalidad_formacion_nombre ?? '—'}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <SunIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jornada</dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.jornada_nombre ?? '—'}</dd>
          </div>
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <CalendarDaysIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Fecha inicio — Fecha fin
            </dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">
              {formatFechaVista(ficha.fecha_inicio)} — {formatFechaVista(ficha.fecha_fin)}
            </dd>
          </div>
        </div>
        <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
          <ClockIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div className="min-w-0 flex-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Días de formación
            </dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100 break-words">{diasLabel}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <ClockIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total horas</dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">
              {ficha.total_horas === null || ficha.total_horas === undefined ? '—' : String(ficha.total_horas)}
            </dd>
          </div>
        </div>
        <div className="flex gap-3">
          <UserGroupIcon className="h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Aprendices</dt>
            <dd className="text-sm text-gray-900 dark:text-gray-100">{ficha.cantidad_aprendices}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-5 w-5 shrink-0" aria-hidden />
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Estado</dt>
            <dd>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  ficha.status
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                }`}
              >
                {ficha.status ? 'Activa' : 'Inactiva'}
              </span>
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
