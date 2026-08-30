/**
 * @module features/personalRol/components/PersonalRolTable
 * @description Tabla paginada con acciones del listado del módulo Personal.
 * @author JDTWOR
 * @created 2026-08-14
 */
import { EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { rolEstadoBadgeClass, rolEstaActivo } from '../rolEstadoHelpers';
import type { PersonalRolModuleConfig } from '../config';
import type { PersonalRolItem } from '../types';

interface PersonalRolTableProps {
  config: PersonalRolModuleConfig;
  items: PersonalRolItem[];
  list: PersonalRolItem[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onView: (item: PersonalRolItem) => void;
  onEdit: (item: PersonalRolItem) => void;
  onDelete: (item: PersonalRolItem) => void;
}

/**
 * Tabla con paginación, estados vacíos y acciones ver/editar/eliminar.
 * @param props config, ítems (filtrados), estado de carga, paginación y callbacks.
 */
export function PersonalRolTable({
  config,
  items,
  list,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: Readonly<PersonalRolTableProps>) {
  const totalPages = Math.ceil((total || list.length) / pageSize);

  return (
    <>
      {loading ? (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
          <caption className="sr-only">Listado de {config.labels.title.toLowerCase()}</caption>
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Documento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-28">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
            {items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{item.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.numero_documento ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${rolEstadoBadgeClass(rolEstaActivo(item.estado))}`}>
                    {rolEstaActivo(item.estado) ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(item)}
                      className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Ver"
                    >
                      <EyeIcon className="w-5 h-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <PencilSquareIcon className="w-5 h-5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="w-5 h-5" aria-hidden />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && list.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No hay {config.labels.title.toLowerCase()} registradas.
        </div>
      )}
      {!loading && list.length > 0 && items.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          No hay resultados para la búsqueda o filtros aplicados.
        </div>
      )}
      {!loading && (total > 0 || list.length > 0) && (
        <div className="mt-4 flex items-center justify-between px-4 pb-4 border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total || list.length)} de{' '}
            {total || list.length} resultados
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="btn-secondary disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </>
  );
}