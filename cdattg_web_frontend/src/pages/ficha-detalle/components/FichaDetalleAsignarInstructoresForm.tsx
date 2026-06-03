import type { Dispatch, SetStateAction } from 'react';
import { InstructorSelectAsync } from '../../../components/InstructorSelectAsync';
import { LABEL_INSTRUCTOR_LIDER } from '../../../constants/instructorLiderLabels';
import type { InstructorFichaItem, InstructorFichaResponse, InstructorItem, DiaFormacionItem } from '../../../types';

type FichaDetalleAsignarInstructoresFormProps = Readonly<{
  instructores: InstructorFichaResponse[];
  instructorLiderId: number;
  setInstructorLiderId: Dispatch<SetStateAction<number>>;
  fechaInicio: string;
  setFechaInicio: Dispatch<SetStateAction<string>>;
  fechaFin: string;
  setFechaFin: Dispatch<SetStateAction<string>>;
  instructoresDisponibles: InstructorItem[];
  instructoresSeleccionados: InstructorFichaItem[];
  diasFichaDisponibles: DiaFormacionItem[];
  toggleDiaInstructor: (instructorId: number, diaId: number) => void;
  addInstructorToForm: (instructorId: number) => void;
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
  instructoresDisponibles,
  instructoresSeleccionados,
  diasFichaDisponibles,
  toggleDiaInstructor,
  addInstructorToForm,
  removeInstructorFromForm,
  handleAsignarInstructores,
  onCancel,
}: FichaDetalleAsignarInstructoresFormProps) {
  return (
    <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4">
      <h3 className="mb-3 font-medium text-gray-900 dark:text-white">Asignar instructores</h3>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="detalle-ins-lider-form"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {LABEL_INSTRUCTOR_LIDER}
          </label>
          <div className="mt-1">
            <InstructorSelectAsync
              inputId="detalle-ins-lider-form"
              value={instructorLiderId || undefined}
              onChange={(v) => setInstructorLiderId(v ?? 0)}
              placeholder="Buscar por nombre o documento..."
              isRequired
              defaultLabel={
                instructores.find((i) => i.instructor_id === instructorLiderId)?.instructor_nombre ??
                instructoresDisponibles.find((i) => i.id === instructorLiderId)?.nombre
              }
            />
          </div>
        </div>
        <div>
          <label htmlFor="detalle-fecha-inicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Fecha inicio
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
            Fecha fin
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
        <legend className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Instructores a asignar</legend>
        <div className="flex flex-wrap gap-2">
          {instructoresDisponibles.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => addInstructorToForm(i.id)}
              disabled={instructoresSeleccionados.some((s) => s.instructor_id === i.id)}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              + {i.nombre}
            </button>
          ))}
        </div>
        {instructoresSeleccionados.length > 0 && (
          <ul className="mt-2 space-y-3 text-sm">
            {instructoresSeleccionados.map((s) => {
              const nom = instructoresDisponibles.find((i) => i.id === s.instructor_id)?.nombre;
              return (
                <li key={s.instructor_id} className="rounded border border-gray-200 dark:border-gray-600 p-2">
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
                    <div className="mt-2 flex flex-wrap gap-2">
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
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>
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
