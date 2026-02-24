import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PencilSquareIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import type { ProgramaFormacionResponse, ProgramaFormacionRequest } from '../types';

export const ProgramasFormacion = () => {
  const [list, setList] = useState<ProgramaFormacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramaFormacionResponse | null>(null);
  const [form, setForm] = useState<ProgramaFormacionRequest>({
    codigo: '',
    nombre: '',
    status: true,
  });

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProgramasFormacion(page, pageSize, search);
      setList(response.data);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar programas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ codigo: '', nombre: '', status: true });
    setIsModalOpen(true);
  };

  const openEdit = (item: ProgramaFormacionResponse) => {
    setEditing(item);
    setForm({
      codigo: item.codigo,
      nombre: item.nombre,
      red_conocimiento_id: item.red_conocimiento_id,
      nivel_formacion_id: item.nivel_formacion_id,
      tipo_programa_id: item.tipo_programa_id,
      status: item.status,
      horas_totales: item.horas_totales ?? undefined,
      horas_etapa_lectiva: item.horas_etapa_lectiva ?? undefined,
      horas_etapa_productiva: item.horas_etapa_productiva ?? undefined,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await apiService.updateProgramaFormacion(editing.id, form);
      } else {
        await apiService.createProgramaFormacion(form);
      }
      setIsModalOpen(false);
      fetchList();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este programa de formación?')) return;
    try {
      await apiService.deleteProgramaFormacion(id);
      fetchList();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Programas de formación</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Gestión de programas de formación</p>
        </div>
        <div className="flex gap-2">
          <Link to="/programas/importar" className="btn-secondary">
            <ArrowUpTrayIcon className="w-5 h-5 inline mr-2" />
            Importar programas
          </Link>
          <button onClick={openCreate} className="btn-primary">
            <span className="mr-2">+</span> Nuevo programa
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-md"
        />
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">Cargando...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-28">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                  {list.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No hay programas registrados
                      </td>
                    </tr>
                  ) : (
                    list.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{item.codigo}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.nombre}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              item.status ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                            }`}
                          >
                            {item.status ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Página {page} de {totalPages} ({total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editing ? 'Editar programa' : 'Nuevo programa'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código</label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                  className="input-field mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="input-field mt-1 w-full"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.status ?? true}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))}
                  className="rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Activo</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn-primary">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
