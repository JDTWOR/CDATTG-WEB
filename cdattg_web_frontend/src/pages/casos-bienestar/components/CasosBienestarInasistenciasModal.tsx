import type { CasoBienestarItem, InasistenciaDetalleItem } from '../../../types';

type CasosBienestarInasistenciasModalProps = Readonly<{
  aprendiz: CasoBienestarItem;
  loading: boolean;
  error: string;
  inasistencias: InasistenciaDetalleItem[];
  onClose: () => void;
}>;

export function CasosBienestarInasistenciasModal({
  aprendiz,
  loading,
  error,
  inasistencias,
  onClose,
}: CasosBienestarInasistenciasModalProps) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar modal"
        onClick={onClose}
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 sm:p-6">
        <dialog
          open
          aria-labelledby="casos-bienestar-inas-title"
          className="relative z-10 m-0 flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:max-h-[calc(100vh-3rem)]"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <div>
              <h3 id="casos-bienestar-inas-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                Inasistencias por fecha
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {aprendiz.persona_nombre} · {aprendiz.numero_documento}
              </p>
            </div>
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cerrar
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
              >
                {error}
              </div>
            )}
            {loading && <p className="text-gray-500 dark:text-gray-400">Cargando detalle...</p>}
            {!loading && !error && inasistencias.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">
                No se encontraron fechas de inasistencia para este aprendiz en el período.
              </p>
            )}
            {!loading && inasistencias.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <caption className="sr-only">Inasistencias por fecha del aprendiz</caption>
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Fecha de inasistencia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Instructor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800">
                    {inasistencias.map((item, idx) => (
                      <tr key={`${item.fecha}-${idx}`}>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.fecha}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {item.instructor_nombre || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {item.observaciones || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </dialog>
      </div>
    </div>
  );
}
