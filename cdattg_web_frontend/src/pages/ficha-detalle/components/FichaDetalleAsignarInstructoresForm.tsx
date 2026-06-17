import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { InstructorSelectAsync } from '../../../components/InstructorSelectAsync';
import { SelectSearch } from '../../../components/SelectSearch';
import {
  LABEL_INSTRUCTOR_LIDER,
  MSG_SELECCIONE_INSTRUCTOR_LIDER_PRIMERO,
  PLACEHOLDER_INSTRUCTOR_LIDER,
} from '../../../constants/instructorLiderLabels';
import type { InstructorFichaItem, InstructorFichaResponse, DiaFormacionItem } from '../../../types';

type FichaDetalleAsignarInstructoresFormProps = Readonly<{
  instructores: InstructorFichaResponse[];
  instructorLiderId: number;
  setInstructorLiderId: Dispatch<SetStateAction<number>>;
  fechaInicio: string;
  setFechaInicio: Dispatch<SetStateAction<string>>;
  fechaFin: string;
  setFechaFin: Dispatch<SetStateAction<string>>;
  instructoresSeleccionados: InstructorFichaItem[];
  nombresInstructoresSeleccionados: Record<number, string>;
  diasFichaDisponibles: DiaFormacionItem[];
  toggleDiaInstructor: (instructorId: number, diaId: number) => void;
  addInstructorToForm: (instructorId: number, nombre: string) => void;
  removeInstructorFromForm: (instructorId: number) => void;
  handleAsignarInstructores: () => Promise<void>;
  onCancel: () => void;
}>;

export function FichaDetalleAsignarInstructoresForm({
  instructores,
  instructorLiderId,
  setInstructorLiderId,
  fechaInicio,
  setFechaInicio,
  fechaFin,
  setFechaFin,
  instructoresSeleccionados,
  nombresInstructoresSeleccionados,
  diasFichaDisponibles,
  toggleDiaInstructor,
  addInstructorToForm,
  removeInstructorFromForm,
  handleAsignarInstructores,
  onCancel,
}: FichaDetalleAsignarInstructoresFormProps) {
  const [busquedaInstructorId, setBusquedaInstructorId] = useState<number | undefined>();
  const [busquedaInstructorNombre, setBusquedaInstructorNombre] = useState('');

  const excludeIds = useMemo(
    () => [
      ...instructores.map((i) => i.instructor_id),
      ...instructoresSeleccionados.map((i) => i.instructor_id),
    ],
    [instructores, instructoresSeleccionados],
  );

  const opcionesLider = useMemo(() => {
    const byId = new Map<number, string>();
    for (const inst of instructores) {
      byId.set(inst.instructor_id, inst.instructor_nombre);
    }
    for (const sel of instructoresSeleccionados) {
      if (!byId.has(sel.instructor_id)) {
        byId.set(
          sel.instructor_id,
          nombresInstructoresSeleccionados[sel.instructor_id] ?? `Instructor #${sel.instructor_id}`,
        );
      }
    }
    return [...byId.entries()].map(([value, label]) => ({ value, label }));
  }, [instructores, instructoresSeleccionados, nombresInstructoresSeleccionados]);

  const agregarDesdeBusqueda = () => {
    if (!busquedaInstructorId) return;
    addInstructorToForm(busquedaInstructorId, busquedaInstructorNombre);
    setBusquedaInstructorId(undefined);
    setBusquedaInstructorNombre('');
  };

  return (
    <div className="mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
      <h3 className="mb-1 font-medium text-gray-900 dark:text-white">Asignar instructores</h3>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Busque por nombre o documento. Los días de formación son opcionales aquí; puede programarlos después con{' '}
        <strong>Editar programación</strong>.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="detalle-fecha-inicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha inicio vigencia
          </label>
          <input
            id="detalle-fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="input-field mt-1 w-full"
          />
        </div>
        <div>
          <label htmlFor="detalle-fecha-fin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha fin vigencia
          </label>
          <input
            id="detalle-fecha-fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="input-field mt-1 w-full"
          />
        </div>
      </div>

      <fieldset className="mb-4 border-0 p-0">
        <legend className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Agregar instructor
        </legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <InstructorSelectAsync
              inputId="detalle-ins-buscar"
              value={busquedaInstructorId}
              excludeIds={excludeIds}
              defaultLabel={busquedaInstructorNombre || undefined}
              onChange={(id) => {
                setBusquedaInstructorId(id);
                if (!id) setBusquedaInstructorNombre('');
              }}
              onOptionChange={(opt) => setBusquedaInstructorNombre(opt?.label ?? '')}
              placeholder="Buscar por nombre o documento..."
            />
          </div>
          <button
            type="button"
            onClick={agregarDesdeBusqueda}
            disabled={!busquedaInstructorId}
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            Agregar
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Escriba al menos dos caracteres para buscar entre todos los instructores.
        </p>
      </fieldset>

      {instructoresSeleccionados.length > 0 && (
        <ul className="mb-4 space-y-3 text-sm">
          {instructoresSeleccionados.map((s) => {
            const nom =
              nombresInstructoresSeleccionados[s.instructor_id] ?? `Instructor #${s.instructor_id}`;
            return (
              <li key={s.instructor_id} className="rounded border border-gray-200 p-3 dark:border-gray-600">
                <div className="flex items-center justify-between gap-2 text-gray-800 dark:text-gray-200">
                  <span className="font-medium">{nom}</span>
                  <button
                    type="button"
                    onClick={() => removeInstructorFromForm(s.instructor_id)}
                    className="text-red-600 dark:text-red-400"
                  >
                    Quitar
                  </button>
                </div>
                {diasFichaDisponibles.length > 0 && (
                  <div className="mt-2">
                    <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                      Días (opcional)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {diasFichaDisponibles.map((dia) => (
                        <label key={dia.id} className="inline-flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={(s.dias_formacion_ids ?? []).includes(dia.id)}
                            onChange={() => toggleDiaInstructor(s.instructor_id, dia.id)}
                          />
                          {dia.nombre}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(opcionesLider.length > 0 || instructoresSeleccionados.length > 0) && (
        <div className="mb-4">
          <label
            htmlFor="detalle-ins-lider-form"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {LABEL_INSTRUCTOR_LIDER}
          </label>
          <div className="mt-1 max-w-md">
            {opcionesLider.length > 0 ? (
              <SelectSearch
                inputId="detalle-ins-lider-form"
                options={opcionesLider}
                value={instructorLiderId || undefined}
                onChange={(v) => setInstructorLiderId(v ?? 0)}
                placeholder={PLACEHOLDER_INSTRUCTOR_LIDER}
                isRequired
              />
            ) : (
              <p className="text-sm text-amber-700 dark:text-amber-300">{MSG_SELECCIONE_INSTRUCTOR_LIDER_PRIMERO}</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
        <button type="button" onClick={() => void handleAsignarInstructores()} className="btn-primary">
          Guardar asignación
        </button>
      </div>
    </div>
  );
}
