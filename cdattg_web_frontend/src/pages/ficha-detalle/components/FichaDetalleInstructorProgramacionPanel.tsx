import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import type { DiaFormacionItem, InstructorFichaResponse } from '../../../types';

type FichaDetalleInstructorProgramacionPanelProps = Readonly<{
  inst: InstructorFichaResponse;
  diasFichaDisponibles: DiaFormacionItem[];
  fechaInicioDraft: string;
  fechaFinDraft: string;
  programacionDiasDraft: number[];
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  onToggleDia: (diaId: number) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  guardando: boolean;
}>;

export function FichaDetalleInstructorProgramacionPanel({
  inst,
  diasFichaDisponibles,
  fechaInicioDraft,
  fechaFinDraft,
  programacionDiasDraft,
  onFechaInicioChange,
  onFechaFinChange,
  onToggleDia,
  onGuardar,
  onCancelar,
  guardando,
}: FichaDetalleInstructorProgramacionPanelProps) {
  const fechasInvalidas =
    !fechaInicioDraft ||
    !fechaFinDraft ||
    fechaInicioDraft > fechaFinDraft;
  const puedeGuardar = !fechasInvalidas && programacionDiasDraft.length > 0 && !guardando;

  return (
    <div className="mt-3 w-full rounded-lg border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-900/20">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDaysIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" aria-hidden />
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Programación de {inst.instructor_nombre}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`prog-ins-${inst.instructor_id}-inicio`}
            className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            Vigencia — inicio
          </label>
          <input
            id={`prog-ins-${inst.instructor_id}-inicio`}
            type="date"
            value={fechaInicioDraft}
            onChange={(e) => onFechaInicioChange(e.target.value)}
            className="input-field mt-1 w-full text-sm"
          />
        </div>
        <div>
          <label
            htmlFor={`prog-ins-${inst.instructor_id}-fin`}
            className="block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
          >
            Vigencia — fin
          </label>
          <input
            id={`prog-ins-${inst.instructor_id}-fin`}
            type="date"
            value={fechaFinDraft}
            min={fechaInicioDraft || undefined}
            onChange={(e) => onFechaFinChange(e.target.value)}
            className="input-field mt-1 w-full text-sm"
          />
        </div>
      </div>
      {fechasInvalidas && fechaInicioDraft && fechaFinDraft && (
        <p className="mb-3 text-xs text-red-600 dark:text-red-400">
          La fecha de fin debe ser igual o posterior a la de inicio.
        </p>
      )}

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Días de formación
      </p>
      {diasFichaDisponibles.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {diasFichaDisponibles.map((dia) => (
            <label key={dia.id} className="inline-flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={programacionDiasDraft.includes(dia.id)}
                onChange={() => onToggleDia(dia.id)}
              />
              {dia.nombre}
            </label>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          La ficha no tiene días de formación definidos. Edite la ficha primero.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onGuardar}
          disabled={!puedeGuardar}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar programación'}
        </button>
        <button type="button" onClick={onCancelar} className="btn-secondary text-sm">
          Cancelar
        </button>
      </div>
    </div>
  );
}
