/**
 * @module features/personalRol/components/ImportHistory
 * @description Tabla del historial de importaciones del módulo Personal con botón de actualización.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { formatFechaHoraVista } from '../../../utils/formatFecha';
import type { PersonalRolImportLogItem } from '../types';

interface ImportHistoryProps {
  items: PersonalRolImportLogItem[];
  loading: boolean;
  caption: string;
  onRefresh: () => void;
}

/**
 * Renderiza el historial de importaciones con estados de carga y vacío.
 * @param props ítems del historial, estado de carga, caption de accesibilidad y refresh.
 */
export function ImportHistory({ items, loading, caption, onRefresh }: Readonly<ImportHistoryProps>) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" aria-hidden /> Historial de importaciones
      </h2>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Actualizar"
          aria-label="Actualizar historial de importaciones"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
        </button>
      </div>
      <div className="mt-3 overflow-x-auto">
        {loading && <div className="py-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>}
        {!loading && items.length === 0 && (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">Aún no hay importaciones registradas.</p>
        )}
        {!loading && items.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Archivo</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Procesados</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Duplicados</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {items.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100 truncate max-w-[120px]" title={log.filename}>
                    {log.filename}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {formatFechaHoraVista(log.created_at)}
                  </td>
                  <td className="px-3 py-2">{log.processed_count}</td>
                  <td className="px-3 py-2">{log.duplicates_count}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400 truncate max-w-[100px]" title={log.usuario_nombre}>
                    {log.usuario_nombre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}