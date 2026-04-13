import { useState, useEffect, useCallback, type ComponentProps } from 'react';
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { SelectSearch } from '../components/SelectSearch';
import { PersonaSelectAsync } from '../components/PersonaSelectAsync';
import type { AprendizResponse, FichaCaracterizacionResponse } from '../types';

function fichaSelectLabel(f: FichaCaracterizacionResponse): string {
  const base = `Ficha ${f.ficha}`;
  if (!f.programa_formacion_nombre) {
    return base;
  }
  return `${base} - ${f.programa_formacion_nombre}`;
}

const IDS = {
  createPersona: 'aprendices-create-persona',
  createFicha: 'aprendices-create-ficha',
  createEstado: 'aprendices-create-estado',
  editFicha: 'aprendices-edit-ficha',
  editEstado: 'aprendices-edit-estado',
} as const;

const TITLE = {
  create: 'aprendices-modal-create-title',
  view: 'aprendices-modal-view-title',
  edit: 'aprendices-modal-edit-title',
  delete: 'aprendices-modal-delete-title',
} as const;

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
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);

  const fetchAprendices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getAprendices(page, pageSize, undefined, searchText.trim() || undefined);
      setList(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'Error al cargar aprendices'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText]);

  useEffect(() => {
    const t = globalThis.setTimeout(() => {
      void fetchAprendices();
    }, 300);
    return () => globalThis.clearTimeout(t);
  }, [fetchAprendices]);

  useEffect(() => {
    if (modalOpen || modalEdit) {
      void apiService
        .getFichasCaracterizacion(1, 500)
        .then((res) => setFichas(res.data))
        .catch(() => {});
    }
  }, [modalOpen, modalEdit]);

  const handleCreate = () => {
    setPersonaId('');
    setFichaId('');
    setEstado(true);
    setModalOpen(true);
  };

  const submitCreate = async (): Promise<void> => {
    const pid = personaId === '' ? undefined : personaId;
    const fid = fichaId === '' ? undefined : fichaId;
    if (pid === undefined) {
      globalThis.alert('Seleccione una persona');
      return;
    }
    if (fid === undefined) {
      globalThis.alert('Seleccione una ficha de caracterización');
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
      void fetchAprendices();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'Error al guardar aprendiz'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    void submitCreate();
  };

  const openEdit = (item: AprendizResponse) => {
    setModalEdit(item);
    setEditFichaId(String(item.ficha_caracterizacion_id));
    setEditEstado(item.estado);
  };

  const submitUpdate = async (): Promise<void> => {
    if (!modalEdit) {
      return;
    }
    if (editFichaId === '') {
      globalThis.alert('Seleccione una ficha');
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
      void fetchAprendices();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'Error al actualizar aprendiz'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    void submitUpdate();
  };

  const handleDelete = async () => {
    if (!modalDelete) {
      return;
    }
    setSaving(true);
    try {
      await apiService.deleteAprendiz(modalDelete.id);
      setModalDelete(null);
      void fetchAprendices();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'Error al eliminar aprendiz'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Aprendices</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Gestiona y administra los aprendices del SENA</p>
        </div>
        <button type="button" onClick={handleCreate} className="btn-primary">
          <span className="inline-flex items-center">
            <PlusIcon className="mr-2 h-5 w-5" />
            Nuevo Aprendiz
          </span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-4 border-b border-gray-200 px-4 py-3 dark:border-gray-600">
          <input
            type="search"
            placeholder="Buscar por nombre, documento, ficha o programa..."
            className="input-field max-w-md flex-1"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPage(1);
            }}
            aria-label="Buscar aprendices"
          />
          <select className="input-field w-40" disabled aria-label="Filtro estado (próximamente)">
            <option>Todos los estados</option>
          </select>
          <select className="input-field w-40" disabled aria-label="Filtro fichas (próximamente)">
            <option>Todas las fichas</option>
          </select>
          <select className="input-field w-40" disabled aria-label="Filtro programas (próximamente)">
            <option>Todos los programas</option>
          </select>
          <select className="input-field w-40" disabled aria-label="Filtro regionales (próximamente)">
            <option>Todas las regionales</option>
          </select>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                  Nombre completo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ficha</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Programa</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Regional</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Estado</th>
                <th className="w-28 px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-600 dark:bg-gray-800">
              {list.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{item.persona_nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.persona_documento ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.ficha_numero ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.programa_nombre ?? '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{item.regional_nombre ?? '-'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        item.estado
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.estado ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setModalView(item)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        title="Ver"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-lg p-2 text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                        title="Editar"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalDelete(item)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-5 w-5" />
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
        {!loading && total > 0 && (
          <div className="mt-4 flex items-center justify-between px-4 pb-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, total)} de {total} resultados
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
                className="btn-secondary disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/50"
            aria-label="Cerrar formulario de nuevo aprendiz"
            onClick={() => setModalOpen(false)}
          />
          <dialog
            open
            className="relative z-10 m-0 w-full max-w-md flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            aria-labelledby={TITLE.create}
          >
            <h2 id={TITLE.create} className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Crear Aprendiz
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Asignar aprendiz</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={IDS.createPersona} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Persona *
                </label>
                <PersonaSelectAsync
                  inputId={IDS.createPersona}
                  ariaLabel="Persona"
                  value={personaId === '' ? undefined : personaId}
                  onChange={(v) => setPersonaId(v ?? '')}
                  placeholder="Buscar por nombre o documento..."
                  isRequired
                />
              </div>
              <div>
                <label htmlFor={IDS.createFicha} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ficha de Caracterización *
                </label>
                <SelectSearch
                  inputId={IDS.createFicha}
                  options={fichas.map((f) => ({
                    value: f.id,
                    label: fichaSelectLabel(f),
                  }))}
                  value={fichaId === '' ? undefined : fichaId}
                  onChange={(v) => setFichaId(v ?? '')}
                  placeholder="Seleccione una ficha"
                  isRequired
                  ariaLabel="Ficha de caracterización"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ficha de caracterización a la que pertenecerá el aprendiz
                </p>
              </div>
              <div>
                <label htmlFor={IDS.createEstado} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado
                </label>
                <select
                  id={IDS.createEstado}
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
          </dialog>
        </div>
      )}

      {modalView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/50"
            aria-label="Cerrar detalle del aprendiz"
            onClick={() => setModalView(null)}
          />
          <dialog
            open
            className="relative z-10 m-0 w-full max-w-md flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            aria-labelledby={TITLE.view}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 id={TITLE.view} className="text-xl font-bold text-gray-900 dark:text-white">
                Detalle del aprendiz
              </h2>
              <button
                type="button"
                onClick={() => setModalView(null)}
                className="rounded p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Nombre completo</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-white">{modalView.persona_nombre}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Documento</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-white">{modalView.persona_documento ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Ficha</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-white">{modalView.ficha_numero ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Programa</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-white">{modalView.programa_nombre ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Regional</dt>
                <dd className="mt-0.5 text-gray-900 dark:text-white">{modalView.regional_nombre ?? '-'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Estado</dt>
                <dd className="mt-0.5">
                  <span
                    className={`rounded px-2 py-1 text-xs ${
                      modalView.estado
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
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
          </dialog>
        </div>
      )}

      {modalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/50"
            aria-label="Cerrar edición de aprendiz"
            onClick={() => setModalEdit(null)}
          />
          <dialog
            open
            className="relative z-10 m-0 w-full max-w-md flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            aria-labelledby={TITLE.edit}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 id={TITLE.edit} className="text-xl font-bold text-gray-900 dark:text-white">
                Editar aprendiz
              </h2>
              <button
                type="button"
                onClick={() => setModalEdit(null)}
                className="rounded p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Aprendiz: {modalEdit.persona_nombre}</p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label htmlFor={IDS.editFicha} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ficha de Caracterización *
                </label>
                <SelectSearch
                  inputId={IDS.editFicha}
                  options={fichas.map((f) => ({
                    value: f.id,
                    label: fichaSelectLabel(f),
                  }))}
                  value={editFichaId === '' ? undefined : Number(editFichaId)}
                  onChange={(v) => setEditFichaId(v === undefined || v === null ? '' : String(v))}
                  placeholder="Seleccione una ficha"
                  isRequired
                  ariaLabel="Ficha de caracterización"
                />
              </div>
              <div>
                <label htmlFor={IDS.editEstado} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estado
                </label>
                <select
                  id={IDS.editEstado}
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
          </dialog>
        </div>
      )}

      {modalDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 z-0 bg-black/50"
            aria-label="Cancelar eliminación"
            onClick={() => setModalDelete(null)}
          />
          <dialog
            open
            className="relative z-10 m-0 w-full max-w-md flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
            aria-labelledby={TITLE.delete}
          >
            <h2 id={TITLE.delete} className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Eliminar aprendiz
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              ¿Está seguro de eliminar al aprendiz <strong>{modalDelete.persona_nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setModalDelete(null)} className="btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
};
