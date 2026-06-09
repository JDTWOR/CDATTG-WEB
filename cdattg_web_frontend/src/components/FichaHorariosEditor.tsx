import { useMemo } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SelectSearch } from './SelectSearch';
import {
  enrichHorariosLabels,
  fusionarPlantilla,
  labelOrigen,
  plantillaActiva,
  quitarPlantilla,
  validarSinSolape,
} from '../utils/fichaCaracterizacionHorarios';
import type { DiaFormacionItem, FichaDiaFormacionItem, JornadaItem } from '../types';

type FichaHorariosEditorProps = Readonly<{
  horarios: FichaDiaFormacionItem[];
  onChange: (next: FichaDiaFormacionItem[]) => void;
  jornadas: JornadaItem[];
  diasFormacion: DiaFormacionItem[];
  inputIdPrefix?: string;
}>;

export function FichaHorariosEditor({
  horarios,
  onChange,
  jornadas,
  diasFormacion,
  inputIdPrefix = 'ficha-horarios',
}: FichaHorariosEditorProps) {
  const enriched = useMemo(
    () => enrichHorariosLabels(horarios, diasFormacion, jornadas),
    [horarios, diasFormacion, jornadas],
  );

  const solapeError = useMemo(() => validarSinSolape(enriched), [enriched]);

  const togglePlantilla = (j: JornadaItem, checked: boolean) => {
    if (checked) {
      onChange(fusionarPlantilla(horarios, j));
    } else {
      onChange(quitarPlantilla(horarios, j.id));
    }
  };

  const updateRow = (index: number, patch: Partial<FichaDiaFormacionItem>) => {
    const next = horarios.map((h, i) => {
      if (i !== index) return h;
      const updated = { ...h, ...patch };
      if (patch.hora_inicio !== undefined || patch.hora_fin !== undefined || patch.dia_formacion_id !== undefined) {
        updated.jornada_id = undefined;
        updated.jornada_nombre = undefined;
      }
      return updated;
    });
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(horarios.filter((_, i) => i !== index));
  };

  const addBloque = () => {
    const firstDia = diasFormacion[0]?.id ?? 1;
    onChange([
      ...horarios,
      {
        dia_formacion_id: firstDia,
        hora_inicio: '08:00',
        hora_fin: '12:00',
        orden: horarios.length,
      },
    ]);
  };

  return (
    <div className="mt-4 space-y-4">
      <fieldset className="border-0 p-0">
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Plantillas de jornada
        </legend>
        <div className="flex flex-wrap gap-3">
          {jornadas.map((j) => (
            <label key={j.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={plantillaActiva(horarios, j)}
                onChange={(e) => togglePlantilla(j, e.currentTarget.checked)}
                className="rounded border-gray-300"
              />
              {j.nombre}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Programación horaria</span>
          <button type="button" onClick={addBloque} className="btn-secondary text-sm inline-flex items-center gap-1">
            <PlusIcon className="h-4 w-4" />
            Agregar bloque
          </button>
        </div>
        {solapeError && (
          <p className="mb-2 text-sm text-red-600 dark:text-red-400">{solapeError}</p>
        )}
        {enriched.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Seleccione plantillas o agregue bloques personalizados.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Día</th>
                  <th className="px-3 py-2 text-left font-medium">Inicio</th>
                  <th className="px-3 py-2 text-left font-medium">Fin</th>
                  <th className="px-3 py-2 text-left font-medium">Origen</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {enriched.map((h, idx) => (
                  <tr key={`${h.dia_formacion_id}-${h.hora_inicio}-${h.hora_fin}-${idx}`} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2 min-w-[140px]">
                      <SelectSearch
                        inputId={`${inputIdPrefix}-dia-${idx}`}
                        options={diasFormacion.map((d) => ({ value: d.id, label: d.nombre }))}
                        value={h.dia_formacion_id}
                        onChange={(v) => updateRow(idx, { dia_formacion_id: v ?? h.dia_formacion_id })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={h.hora_inicio}
                        onChange={(e) => updateRow(idx, { hora_inicio: e.target.value })}
                        className="w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={h.hora_fin}
                        onChange={(e) => updateRow(idx, { hora_fin: e.target.value })}
                        className="w-full rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{labelOrigen(h)}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400"
                        aria-label="Eliminar bloque"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export { validarSinSolape };
