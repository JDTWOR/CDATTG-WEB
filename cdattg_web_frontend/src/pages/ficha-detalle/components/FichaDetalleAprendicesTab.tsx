import type { FichaAprendicesTabModel } from '../hooks/useFichaAprendices';

type FichaDetalleAprendicesTabProps = Readonly<FichaAprendicesTabModel>;

export function FichaDetalleAprendicesTab({
  aprendices,
  showFormAprendices,
  setShowFormAprendices,
  personasNoAprendices,
  personasSeleccionadas,
  onPersonaCheckboxChange,
  handleAsignarAprendices,
  handleDesasignarAprendices,
}: FichaDetalleAprendicesTabProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Aprendices asignados a esta ficha</h2>
        <button type="button" onClick={() => setShowFormAprendices(true)} className="btn-primary">
          Asignar aprendices
        </button>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-600">
        {aprendices.filter((a) => a.estado).length === 0 ? (
          <li className="py-4 text-gray-500 dark:text-gray-400">Ningún aprendiz asignado.</li>
        ) : (
          aprendices
            .filter((a) => a.estado)
            .map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-medium text-gray-900 dark:text-gray-100">{a.persona_nombre}</span>
                <button
                  type="button"
                  onClick={() => void handleDesasignarAprendices([a.persona_id])}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Desasignar
                </button>
              </li>
            ))
        )}
      </ul>

      {showFormAprendices && (
        <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4">
          <h3 className="mb-3 font-medium text-gray-900 dark:text-white">Asignar aprendices (personas)</h3>
          <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Seleccione personas que aún no están en esta ficha:</p>
          <div className="mb-4 max-h-48 overflow-y-auto rounded border border-gray-200 dark:border-gray-600 p-2">
            {personasNoAprendices.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay personas disponibles para asignar.</p>
            ) : (
              personasNoAprendices.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={personasSeleccionadas.includes(p.id)}
                    onChange={(e) => onPersonaCheckboxChange(p.id, e.target.checked)}
                  />
                  <span className="text-sm text-gray-800 dark:text-gray-200">
                    {p.full_name} ({p.numero_documento})
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowFormAprendices(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="button" onClick={() => void handleAsignarAprendices()} className="btn-primary">
              Guardar asignación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
