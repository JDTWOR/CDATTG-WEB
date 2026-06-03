import type { CasoBienestarItem } from '../../../types';

type CasosBienestarAprendicesTableProps = Readonly<{
  fichaNumero: string;
  casos: CasoBienestarItem[];
  casosTotal: number;
  busquedaActiva: boolean;
  onVerDetalle: (caso: CasoBienestarItem) => void;
}>;

export function CasosBienestarAprendicesTable({
  fichaNumero,
  casos,
  casosTotal,
  busquedaActiva,
  onVerDetalle,
}: CasosBienestarAprendicesTableProps) {
  if (casosTotal === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        No se encontraron aprendices que cumplan los criterios en esta ficha para el período seleccionado.
      </div>
    );
  }

  if (casos.length === 0 && busquedaActiva) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Ningún aprendiz coincide con la búsqueda.
        {casosTotal > 0 && (
          <span className="mt-1 block text-xs">
            Mostrando 0 de {casosTotal} aprendices en riesgo
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {busquedaActiva && casosTotal > 0 && (
        <p className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400">
          Mostrando {casos.length} de {casosTotal} aprendices
        </p>
      )}
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
        <caption className="sr-only">
          Aprendices de la ficha {fichaNumero} con indicadores de riesgo
        </caption>
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Documento
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Nombre
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Sede
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Sesiones
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Asistió
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Inasistencias
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
              Detalle
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800">
          {casos.map((c) => (
            <tr key={c.aprendiz_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{c.numero_documento}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {c.persona_nombre}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{c.sede_nombre || '–'}</td>
              <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                {c.total_sesiones}
              </td>
              <td className="px-4 py-3 text-right text-sm text-green-600 dark:text-green-400">
                {c.asistencias_efectivas}
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-amber-600 dark:text-amber-400">
                {c.inasistencias}
              </td>
              <td className="px-4 py-3 text-right text-sm">
                <button
                  type="button"
                  onClick={() => onVerDetalle(c)}
                  className="btn-secondary text-xs"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
