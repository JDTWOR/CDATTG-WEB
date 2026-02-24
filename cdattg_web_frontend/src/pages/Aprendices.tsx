import { useState, useEffect } from 'react';
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { SelectSearch } from '../components/SelectSearch';
import { PersonaSelectAsync } from '../components/PersonaSelectAsync';
import type { AprendizResponse, FichaCaracterizacionResponse } from '../types';

export const Aprendices = () => {
  const [list, setList] = useState<AprendizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<AprendizResponse | null>(null);
  const [modalEdit, setModalEdit] = useState<AprendizResponse | null>(null);
  const [modalDelete, setModalDelete] = useState<AprendizResponse | null>(null);
  const [fichas, setFichas] = useState<FichaCaracterizacionResponse[]>([]);
  const [personaId, setPersonaId] = useState<number | ''>('');
  const [fichaId, setFichaId] = useState<number | ''>('');
  const [estado, setEstado] = useState(true);
  const [editFichaId, setEditFichaId] = useState<string>('');
  const [editEstado, setEditEstado] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAprendices = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAprendices(1, 100);
      setList(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar aprendices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAprendices();
  }, []);

  useEffect(() => {
    if (modalOpen || modalEdit) {
      apiService.getFichasCaracterizacion(1, 500).then((res) => setFichas(res.data)).catch(() => {});
    }
  }, [modalOpen, modalEdit]);

  const handleCreate = () => {
    setPersonaId('');
    setFichaId('');
    setEstado(true);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = personaId === '' ? undefined : personaId;
    const fid = fichaId === '' ? undefined : fichaId;
    if (pid == null) {
      alert('Seleccione una persona');
      return;
    }
    if (fid == null) {
      alert('Seleccione una ficha de caracterización');
      return;
    }
    setSaving(true);
    try {
      await apiService.createAprendiz({
        persona_id: pid,
        ficha_caracterizacion_id: fid,
        estado,
      });
      setModalOpen(false);
      fetchAprendices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar aprendiz');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: AprendizResponse) => {
    setModalEdit(item);
    setEditFichaId(String(item.ficha_caracterizacion_id));
    setEditEstado(item.estado);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEdit) return;
    if (editFichaId === '') {
      alert('Seleccione una ficha');
      return;
    }
    setSaving(true);
    try {
      await apiService.updateAprendiz(modalEdit.id, {
        persona_id: modalEdit.persona_id,
        ficha_caracterizacion_id: Number(editFichaId),
        estado: editEstado,
      });
      setModalEdit(null);
      fetchAprendices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al actualizar aprendiz');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!modalDelete) return;
    setSaving(true);
    try {
      await apiService.deleteAprendiz(modalDelete.id);
      setModalDelete(null);
      fetchAprendices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar aprendiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Aprendices</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Gestiona y administra los aprendices del SENA</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <span className="inline-flex items-center">
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuevo Aprendiz
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 flex items-center gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre, documento, ficha..."
            className="input-field flex-1 max-w-md"
          />
          <select className="input-field w-40">
            <option>Todos los estados</option>
          </select>
          <select className="input-field w-40">
            <option>Todas las fichas</option>
          </select>
          <select className="input-field w-40">
            <option>Todos los programas</option>
          </select>
          <select className="input-field w-40">
            <option>Todas las regionales</option>
          </select>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre completo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ficha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Programa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Regional</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {list.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{item.persona_nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.persona_documento ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.ficha_numero ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.programa_nombre ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.regional_nombre ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${item.estado ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {item.estado ? 'ACTIVO' : 'INACTIVO'}
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
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay aprendices registrados.</div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Crear Aprendiz</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Asignar aprendiz</p>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ficha de Caracterización *</label>
                <SelectSearch
                  options={fichas.map((f) => ({
                    value: f.id,
                    label: `Ficha ${f.ficha}${f.programa_formacion_nombre ? ` - ${f.programa_formacion_nombre}` : ''}`,
                  }))}
                  value={fichaId === '' ? undefined : fichaId}
                  onChange={(v) => setFichaId(v ?? '')}
                  placeholder="Seleccione una ficha"
                  isRequired
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ficha de caracterización a la que pertenecerá el aprendiz</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
                <select
                  value={estado ? '1' : '0'}
                  onChange={(e) => setEstado(e.target.value === '1')}
                  className="input-field w-full"
                >
                  <option value="1">Activo</option>
                  <option value="0">Inactivo</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Aprendiz'}
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalle del aprendiz</h2>
              <button type="button" onClick={() => setModalView(null)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Nombre completo</dt>
                <dd className="text-gray-900 dark:text-white mt-0.5">{modalView.persona_nombre}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Documento</dt>
                <dd className="text-gray-900 dark:text-white mt-0.5">{modalView.persona_documento ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Ficha</dt>
                <dd className="text-gray-900 dark:text-white mt-0.5">{modalView.ficha_numero ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Programa</dt>
                <dd className="text-gray-900 dark:text-white mt-0.5">{modalView.programa_nombre ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Regional</dt>
                <dd className="text-gray-900 dark:text-white mt-0.5">{modalView.regional_nombre ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Estado</dt>
                <dd className="mt-0.5">
                  <span className={`px-2 py-1 text-xs rounded ${modalView.estado ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {modalView.estado ? 'ACTIVO' : 'INACTIVO'}
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar aprendiz</h2>
              <button type="button" onClick={() => setModalEdit(null)} className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Aprendiz: {modalEdit.persona_nombre}</p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ficha de Caracterización *</label>
                <SelectSearch
                  options={fichas.map((f) => ({
                    value: f.id,
                    label: `Ficha ${f.ficha}${f.programa_formacion_nombre ? ` - ${f.programa_formacion_nombre}` : ''}`,
                  }))}
                  value={editFichaId === '' ? undefined : Number(editFichaId)}
                  onChange={(v) => setEditFichaId(v != null ? String(v) : '')}
                  placeholder="Seleccione una ficha"
                  isRequired
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Eliminar aprendiz</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ¿Está seguro de eliminar al aprendiz <strong>{modalDelete.persona_nombre}</strong>? Esta acción no se puede deshacer.
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
