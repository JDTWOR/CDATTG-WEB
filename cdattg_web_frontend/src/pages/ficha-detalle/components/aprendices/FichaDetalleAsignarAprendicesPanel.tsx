type FichaDetalleAsignarAprendicesPanelProps = Readonly<{
  personasNoAprendices: { id: number; full_name: string; numero_documento: string }[];
  personasSeleccionadas: number[];
  onPersonaCheckboxChange: (personaId: number, checked: boolean) => void;
  onGuardar: () => void;
  onCancelar: () => void;
}>;

export function FichaDetalleAsignarAprendicesPanel({
  personasNoAprendices,
  personasSeleccionadas,
  onPersonaCheckboxChange,
  onGuardar,
  onCancelar,
}: FichaDetalleAsignarAprendicesPanelProps) {
  return (
    <div className="mt-6 rounded-lg border border-primary-200 bg-primary-50/30 p-4 dark:border-primary-800 dark:bg-primary-900/20">
      <h3 className="mb-3 font-medium text-gray-900 dark:text-white">Asignar aprendices (personas)</h3>
      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
        Seleccione personas que aún no están en esta ficha:
      </p>
      <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-600 dark:bg-gray-800">
        {personasNoAprendices.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay personas disponibles para asignar.
          </p>
        ) : (
          personasNoAprendices.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
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
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onCancelar} className="btn-secondary">
          Cancelar
        </button>
        <button type="button" onClick={onGuardar} className="btn-primary">
          Guardar asignación
        </button>
      </div>
    </div>
  );
}
