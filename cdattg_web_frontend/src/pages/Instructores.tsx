import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { SelectSearch } from '../components/SelectSearch';
import { PersonaSelectAsync } from '../components/PersonaSelectAsync';
import type { InstructorItem, RegionalItem, UpdateInstructorRequest } from '../types';

export const Instructores = () => {
  const [list, setList] = useState<InstructorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<InstructorItem | null>(null);
  const [modalEdit, setModalEdit] = useState<InstructorItem | null>(null);
  const [modalDelete, setModalDelete] = useState<InstructorItem | null>(null);
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [personaId, setPersonaId] = useState<number | ''>('');
  const [regionalId, setRegionalId] = useState<number | ''>('');
  const [editRegionalId, setEditRegionalId] = useState<string>('');
  const [editEstado, setEditEstado] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'activo' | 'inactivo'>('all');
  const [filterRegionalId, setFilterRegionalId] = useState<number | ''>('');

  const fetchInstructores = async () => {
    try {
      setLoading(true);
      const res = await apiService.getInstructores();
      setList(res);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar instructores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructores();
  }, []);

  useEffect(() => {
    apiService.getCatalogosRegionales().then(setRegionales).catch(() => {});
  }, []);

  const handleCreate = () => {
    setPersonaId('');
    setRegionalId('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = personaId === '' ? undefined : personaId;
    if (pid == null) {
      alert('Seleccione una persona');
      return;
    }
    setSaving(true);
    try {
      await apiService.createInstructorFromPersona({
        persona_id: pid,
        regional_id: regionalId === '' ? undefined : Number(regionalId),
      });
      setModalOpen(false);
      fetchInstructores();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear instructor');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: InstructorItem) => {
    setModalEdit(item);
    setEditRegionalId(item.regional_id != null ? String(item.regional_id) : '');
    setEditEstado(item.estado !== false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEdit) return;
    setSaving(true);
    try {
      const payload: UpdateInstructorRequest = {
        regional_id: editRegionalId === '' ? undefined : Number(editRegionalId),
        estado: editEstado,
      };
      await apiService.updateInstructor(modalEdit.id, payload);
      setModalEdit(null);
      fetchInstructores();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar instructor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!modalDelete) return;
    setSaving(true);
    try {
      await apiService.deleteInstructor(modalDelete.id);
      setModalDelete(null);
      fetchInstructores();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar instructor');
    } finally {
      setSaving(false);
    }
  };

  const filteredList = list.filter((item) => {
    const q = searchText.trim().toLowerCase();
    if (q) {
      const matchNombre = item.nombre?.toLowerCase().includes(q);
      const matchDoc = item.numero_documento?.toLowerCase().includes(q);
      if (!matchNombre && !matchDoc) return false;
    }
    if (filterEstado !== 'all') {
      const esActivo = item.estado !== false;
      if (filterEstado === 'activo' && !esActivo) return false;
      if (filterEstado === 'inactivo' && esActivo) return false;
    }
    if (filterRegionalId !== '') {
      if (item.regional_id !== filterRegionalId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructores</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Gestiona y administra los instructores del SENA</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/instructores/importar" className="btn-secondary inline-flex items-center">
            <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
            Importar instructores
          </Link>
          <button onClick={handleCreate} className="btn-primary">
            <span className="inline-flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuevo Instructor
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center gap-4">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por documento, nombre..."
            className="input-field flex-1 max-w-md"
          />
          <select
            className="input-field w-40"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value as 'all' | 'activo' | 'inactivo')}
          >
            <option value="all">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <select
            className="input-field w-40"
            value={filterRegionalId === '' ? '' : filterRegionalId}
            onChange={(e) => setFilterRegionalId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Todas las regionales</option>
            {regionales.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Regional</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {filteredList.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{item.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.numero_documento ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.regional_nombre ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${item.estado !== false ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {item.estado !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModalView(item)}
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Ver"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalDelete(item)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && list.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay instructores registrados.</div>
        )}
        {!loading && list.length > 0 && filteredList.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay resultados para la búsqueda o filtros aplicados.</div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Crear Instructor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Persona *</label>
                <PersonaSelectAsync
                  value={personaId === '' ? undefined : personaId}
                  onChange={(v) => setPersonaId(v ?? '')}
                  placeholder="Buscar por nombre o documento..."
                  isRequired
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Regional</label>
                <SelectSearch
                  options={regionales.map((r) => ({ value: r.id, label: r.nombre }))}
                  value={regionalId === '' ? undefined : regionalId}
                  onChange={(v) => setRegionalId(v ?? '')}
                  placeholder="-- Selecciona una regional --"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalView(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-600" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalle del instructor</h2>
              <button type="button" onClick={() => setModalView(null)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Nombre</dt>
                <dd className="text-gray-900 dark:text-white mt-0.5">{modalView.nombre}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Documento</dt>
                <dd className="text-gray-900 dark:text-white mt-0.5">{modalView.numero_documento ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Regional</dt>
                <dd className="text-gray-900 dark:text-white mt-0.5">{modalView.regional_nombre ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Estado</dt>
                <dd className="mt-0.5">
                  <span className={`px-2 py-1 text-xs rounded ${modalView.estado !== false ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {modalView.estado !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setModalView(null)} className="btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar instructor</h2>
              <button type="button" onClick={() => setModalEdit(null)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Instructor: {modalEdit.nombre}</p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Regional</label>
                <SelectSearch
                  options={regionales.map((r) => ({ value: r.id, label: r.nombre }))}
                  value={editRegionalId === '' ? undefined : Number(editRegionalId)}
                  onChange={(v) => setEditRegionalId(v != null ? String(v) : '')}
                  placeholder="-- Selecciona una regional --"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
                <select
                  value={editEstado ? '1' : '0'}
                  onChange={(e) => setEditEstado(e.target.value === '1')}
                  className="input-field w-full"
                >
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalEdit(null)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setModalDelete(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-600" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Eliminar instructor</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ¿Está seguro de eliminar al instructor <strong>{modalDelete.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModalDelete(null)} className="btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" disabled={saving}>
                {saving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
