import { useMemo } from 'react';
import { ClockIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SelectSearch } from './SelectSearch';
import {
  enrichHorariosLabels,
  fusionarPlantilla,
  labelOrigen,
  plantillaActiva,
  quitarPlantilla,
  validarSinSolape,
} from '../utils/fichaCaracterizacionHorarios';
import { buildHorarioResumenFicha } from '../utils/fichaListDisplay';
import type { DiaFormacionItem, FichaCaracterizacionResponse, FichaDiaFormacionItem, JornadaItem } from '../types';

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

  const resumen = useMemo(() => {
    const mock = { horarios } as FichaCaracterizacionResponse;
    return buildHorarioResumenFicha(mock, diasFormacion);
  }, [horarios, diasFormacion]);

  const togglePlantilla = (j: JornadaItem) => {
    if (plantillaActiva(horarios, j)) {
      onChange(quitarPlantilla(horarios, j.id));
    } else {
      onChange(fusionarPlantilla(horarios, j));
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
    <div className="space-y-4">
      {jornadas.length > 0 ? (
        <fieldset className="border-0 p-0">
          <legend className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Plantillas de jornada
          </legend>
          <div className="flex flex-wrap gap-2">
            {jornadas.map((j) => {
              const activa = plantillaActiva(horarios, j);
              return (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => togglePlantilla(j)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    activa
                      ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary-500 dark:hover:bg-primary-900/20'
                  }`}
                  aria-pressed={activa}
                >
                  {j.nombre}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {enriched.length > 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-primary-200 bg-primary-50/60 px-3 py-2 dark:border-primary-800 dark:bg-primary-950/30">
          <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" aria-hidden />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-primary-900 dark:text-primary-100">{resumen.resumen}</p>
            {resumen.detalle === resumen.resumen ? null : (
              <p className="mt-0.5 text-xs text-primary-700/80 dark:text-primary-300/80">{resumen.detalle}</p>
            )}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Bloques horarios
          </span>
          <button type="button" onClick={addBloque} className="btn-secondary inline-flex items-center gap-1 text-sm">
            <PlusIcon className="h-4 w-4" />
            Agregar bloque
          </button>
        </div>

        {solapeError ? <p className="mb-2 text-sm text-red-600 dark:text-red-400">{solapeError}</p> : null}

        {enriched.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Seleccione una plantilla de jornada o agregue bloques personalizados.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {enriched.map((h, idx) => (
                <div
                  key={`${h.dia_formacion_id}-${h.hora_inicio}-${h.hora_fin}-${idx}`}
                  className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{labelOrigen(h)}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      aria-label="Eliminar bloque"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <SelectSearch
                      inputId={`${inputIdPrefix}-dia-m-${idx}`}
                      options={diasFormacion.map((d) => ({ value: d.id, label: d.nombre }))}
                      value={h.dia_formacion_id}
                      onChange={(v) => updateRow(idx, { dia_formacion_id: v ?? h.dia_formacion_id })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-xs text-gray-500">Inicio</span>
                        <input
                          type="time"
                          value={h.hora_inicio}
                          onChange={(e) => updateRow(idx, { hora_inicio: e.target.value })}
                          className="input-field w-full py-1.5 text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs text-gray-500">Fin</span>
                        <input
                          type="time"
                          value={h.hora_fin}
                          onChange={(e) => updateRow(idx, { hora_fin: e.target.value })}
                          className="input-field w-full py-1.5 text-sm"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600 md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100/80 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Día
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Inicio
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Fin
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Origen
                    </th>
                    <th className="w-10 px-3 py-2.5" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {enriched.map((h, idx) => (
                    <tr key={`${h.dia_formacion_id}-${h.hora_inicio}-${h.hora_fin}-${idx}`}>
                      <td className="min-w-[140px] px-3 py-2">
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
                          className="input-field w-full py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={h.hora_fin}
                          onChange={(e) => updateRow(idx, { hora_fin: e.target.value })}
                          className="input-field w-full py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{labelOrigen(h)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
          </>
        )}
      </div>
    </div>
  );
}

export { validarSinSolape };
