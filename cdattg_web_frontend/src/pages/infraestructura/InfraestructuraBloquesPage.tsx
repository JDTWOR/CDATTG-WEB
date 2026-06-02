import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { SelectSearch } from '../../components/SelectSearch';
import type { BloqueInfraestructuraItem, SedeListItem } from '../../types';
import { InfraestructuraErrorAlert, InfraestructuraSubnav } from './infraestructuraShared';

type FormOnSubmit = NonNullable<ComponentProps<'form'>['onSubmit']>;

function filasBloquesTabla(
  loading: boolean,
  items: BloqueInfraestructuraItem[],
  renderFila: (item: BloqueInfraestructuraItem) => ReactNode,
): ReactNode {
  if (loading) {
    return (
      <tr>
        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
          Cargando…
        </td>
      </tr>
    );
  }
  if (items.length === 0) {
    return (
      <tr>
        <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
          No hay bloques registrados.
        </td>
      </tr>
    );
  }
  return items.map(renderFila);
}

export const InfraestructuraBloquesPage = () => {
  const [items, setItems] = useState<BloqueInfraestructuraItem[]>([]);
  const [sedes, setSedes] = useState<SedeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [nombre, setNombre] = useState('');
  const [sedeId, setSedeId] = useState<number | undefined>();
  const [editId, setEditId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editSedeId, setEditSedeId] = useState<number | undefined>();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bloques, sedesList] = await Promise.all([
        apiService.getInfraestructuraBloques(),
        apiService.getInfraestructuraSedes(),
      ]);
      setItems(bloques);
      setSedes(sedesList);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudieron cargar los bloques.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const sedeOptions = sedes.map((s) => ({
    value: s.id,
    label: s.status ? s.nombre : `${s.nombre} (inactiva)`,
  }));

  const handleCrear: FormOnSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !sedeId) {
      setError('Nombre y sede son obligatorios.');
      return;
    }
    void (async () => {
      setSaving(true);
      setError('');
      try {
        await apiService.createInfraestructuraBloque({ nombre: nombre.trim(), sede_id: sedeId });
        setNombre('');
        setSedeId(undefined);
        await cargar();
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo crear el bloque.'));
      } finally {
        setSaving(false);
      }
    })();
  };

  const guardarEdicion = (id: number) => {
    if (!editNombre.trim() || !editSedeId) {
      setError('Nombre y sede son obligatorios.');
      return;
    }
    void (async () => {
      setSaving(true);
      setError('');
      try {
        await apiService.updateInfraestructuraBloque(id, { nombre: editNombre.trim(), sede_id: editSedeId });
        setEditId(null);
        await cargar();
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo actualizar el bloque.'));
      } finally {
        setSaving(false);
      }
    })();
  };

  const eliminar = (id: number, nombreItem: string) => {
    if (!globalThis.confirm(`¿Eliminar el bloque "${nombreItem}"?`)) return;
    void (async () => {
      setDeletingId(id);
      setError('');
      try {
        await apiService.deleteInfraestructuraBloque(id);
        if (editId === id) setEditId(null);
        await cargar();
      } catch (err: unknown) {
        setError(axiosErrorMessage(err, 'No se pudo eliminar el bloque.'));
      } finally {
        setDeletingId(null);
      }
    })();
  };

  const iniciarEdicion = (item: BloqueInfraestructuraItem) => {
    setEditId(item.id);
    setEditNombre(item.nombre);
    setEditSedeId(item.sede_id);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bloques de infraestructura</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Gestione los bloques asociados a cada sede de formación.
        </p>
        <div className="mt-4">
          <InfraestructuraSubnav currentPath="/infraestructura/bloques" />
        </div>
      </div>

      <InfraestructuraErrorAlert message={error} />

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Nuevo bloque</h2>
        <form onSubmit={handleCrear} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="bloque-nombre" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre *
            </label>
            <input
              id="bloque-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field w-full"
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="bloque-sede" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sede *
            </label>
            <SelectSearch
              inputId="bloque-sede"
              options={sedeOptions}
              value={sedeId}
              onChange={setSedeId}
              isDisabled={saving || loading}
              isRequired
              placeholder="Seleccione sede"
              ariaLabel="Sede del bloque"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Guardando…' : 'Crear bloque'}
          </button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
            <caption className="sr-only">Listado de bloques de infraestructura</caption>
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Sede</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filasBloquesTabla(loading, items, (item) => (
                <tr key={item.id}>
                  {editId === item.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          className="input-field w-full"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <SelectSearch
                          inputId={`edit-sede-${item.id}`}
                          options={sedeOptions}
                          value={editSedeId}
                          onChange={setEditSedeId}
                          ariaLabel="Editar sede del bloque"
                        />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => guardarEdicion(item.id)}
                          disabled={saving}
                          className="btn-primary text-xs px-3 py-1"
                        >
                          Guardar
                        </button>
                        <button type="button" onClick={() => setEditId(null)} className="btn-secondary text-xs px-3 py-1">
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{item.nombre}</td>
                      <td className="px-4 py-3">{item.sede_nombre}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(item)}
                          className="inline-flex items-center gap-1 text-primary-600 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" aria-hidden />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(item.id, item.nombre)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1 text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden />
                          Eliminar
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
