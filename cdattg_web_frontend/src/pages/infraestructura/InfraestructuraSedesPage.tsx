import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { SelectSearch } from '../../components/SelectSearch';
import type { RegionalItem, SedeListItem } from '../../types';
import { InfraestructuraErrorAlert, InfraestructuraStatusBadge, InfraestructuraSubnav } from './infraestructuraShared';

type FormOnSubmit = NonNullable<ComponentProps<'form'>['onSubmit']>;

function filasSedesTabla(
  loading: boolean,
  items: SedeListItem[],
  renderFila: (item: SedeListItem) => ReactNode,
): ReactNode {
  if (loading) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
          Cargando…
        </td>
      </tr>
    );
  }
  if (items.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
          No hay sedes registradas.
        </td>
      </tr>
    );
  }
  return items.map(renderFila);
}

export const InfraestructuraSedesPage = () => {
  const [items, setItems] = useState<SedeListItem[]>([]);
  const [regionales, setRegionales] = useState<RegionalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [regionalId, setRegionalId] = useState<number | undefined>();
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editRegionalId, setEditRegionalId] = useState<number | undefined>();
  const [editStatus, setEditStatus] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [sedes, regs] = await Promise.all([
        apiService.getInfraestructuraSedes(),
        apiService.getCatalogosRegionales(),
      ]);
      setItems(sedes);
      setRegionales(regs);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudieron cargar las sedes.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const resetForm = () => {
    setNombre('');
    setDireccion('');
    setRegionalId(undefined);
  };

  const handleCrear: FormOnSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !regionalId) {
      setError('Nombre y regional son obligatorios.');
      return;
    }
    void (async () => {
      setSaving(true);
      setError('');
      try {
        await apiService.createInfraestructuraSede({
          nombre: nombre.trim(),
          direccion: direccion.trim(),
          regional_id: regionalId,
        });
        resetForm();
        await cargar();
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo crear la sede.'));
      } finally {
        setSaving(false);
      }
    })();
  };

  const iniciarEdicion = (item: SedeListItem) => {
    setEditId(item.id);
    setEditNombre(item.nombre);
    setEditDireccion(item.direccion);
    setEditRegionalId(item.regional_id);
    setEditStatus(item.status);
    setError('');
  };

  const cancelarEdicion = () => {
    setEditId(null);
  };

  const guardarEdicion = (id: number) => {
    if (!editNombre.trim() || !editRegionalId) {
      setError('Nombre y regional son obligatorios.');
      return;
    }
    void (async () => {
      setSaving(true);
      setError('');
      try {
        await apiService.updateInfraestructuraSede(id, {
          nombre: editNombre.trim(),
          direccion: editDireccion.trim(),
          regional_id: editRegionalId,
          status: editStatus,
        });
        setEditId(null);
        await cargar();
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo actualizar la sede.'));
      } finally {
        setSaving(false);
      }
    })();
  };

  const eliminar = (id: number, nombreItem: string) => {
    if (!globalThis.confirm(`¿Eliminar la sede "${nombreItem}"?`)) return;
    void (async () => {
      setDeletingId(id);
      setError('');
      try {
        await apiService.deleteInfraestructuraSede(id);
        if (editId === id) setEditId(null);
        await cargar();
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo eliminar la sede.'));
      } finally {
        setDeletingId(null);
      }
    })();
  };

  const regionalOptions = regionales.map((r) => ({ value: r.id, label: r.nombre }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sedes</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gestione las sedes del centro de formación.
        </p>
        <div className="mt-4">
          <InfraestructuraSubnav currentPath="/infraestructura/sedes" />
        </div>
      </div>

      <InfraestructuraErrorAlert message={error} />

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nueva sede</h2>
        <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="sede-nombre" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre *
            </label>
            <input id="sede-nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="input-field w-full" disabled={saving} />
          </div>
          <div>
            <label htmlFor="sede-direccion" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Dirección
            </label>
            <input id="sede-direccion" type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className="input-field w-full" disabled={saving} />
          </div>
          <div>
            <label htmlFor="sede-regional" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Regional *
            </label>
            <SelectSearch
              inputId="sede-regional"
              options={regionalOptions}
              value={regionalId}
              onChange={setRegionalId}
              isDisabled={saving || loading}
              isRequired
              placeholder="Seleccione regional"
              ariaLabel="Regional de la sede"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando…' : 'Crear sede'}
          </button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
            <caption className="sr-only">Listado de sedes</caption>
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Dirección</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Regional</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600 bg-white dark:bg-gray-900">
              {filasSedesTabla(loading, items, (item) => (
                <tr key={item.id}>
                  {editId === item.id ? (
                    <>
                      <td className="px-4 py-3"><input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="input-field w-full" /></td>
                      <td className="px-4 py-3"><input type="text" value={editDireccion} onChange={(e) => setEditDireccion(e.target.value)} className="input-field w-full" /></td>
                      <td className="px-4 py-3">
                        <SelectSearch inputId={`edit-regional-${item.id}`} options={regionalOptions} value={editRegionalId} onChange={setEditRegionalId} ariaLabel="Editar regional" />
                      </td>
                      <td className="px-4 py-3">
                        <label htmlFor={`edit-status-${item.id}`} className="inline-flex items-center gap-2 text-sm">
                          <input
                            id={`edit-status-${item.id}`}
                            type="checkbox"
                            checked={editStatus}
                            onChange={(e) => setEditStatus(e.target.checked)}
                          />
                          <span>Activa</span>
                        </label>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button type="button" onClick={() => guardarEdicion(item.id)} disabled={saving} className="btn-primary text-xs px-3 py-1">Guardar</button>
                        <button type="button" onClick={cancelarEdicion} className="btn-secondary text-xs px-3 py-1">Cancelar</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.nombre}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.direccion || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.regional_nombre || item.regional_id}</td>
                      <td className="px-4 py-3"><InfraestructuraStatusBadge activo={item.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => iniciarEdicion(item)} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 dark:text-primary-400 mr-3" aria-label={`Editar ${item.nombre}`}>
                          <PencilIcon className="h-4 w-4" aria-hidden /> Editar
                        </button>
                        <button type="button" onClick={() => eliminar(item.id, item.nombre)} disabled={deletingId === item.id} className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400" aria-label={`Eliminar ${item.nombre}`}>
                          <TrashIcon className="h-4 w-4" aria-hidden /> Eliminar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
