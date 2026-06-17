import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CalendarDaysIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import type { DiaSinFormacionSedeItem, SedeItem } from '../../types';

type FormState = {
  sede_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
};

const emptyForm = (): FormState => ({
  sede_id: 0,
  fecha_inicio: '',
  fecha_fin: '',
  motivo: '',
});

function cuerpoTablaRegistros(
  loading: boolean,
  items: DiaSinFormacionSedeItem[],
  onEliminar: (id: number) => void,
): ReactNode {
  if (loading) {
    return <p className="text-sm text-gray-500">Cargando…</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No hay registros.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-600">
            <th className="px-2 py-2">Sede</th>
            <th className="px-2 py-2">Desde</th>
            <th className="px-2 py-2">Hasta</th>
            <th className="px-2 py-2">Motivo</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
              <td className="px-2 py-2">{item.sede_nombre || item.sede_id}</td>
              <td className="px-2 py-2">{item.fecha_inicio}</td>
              <td className="px-2 py-2">{item.fecha_fin}</td>
              <td className="px-2 py-2">{item.motivo}</td>
              <td className="px-2 py-2 text-right">
                <button
                  type="button"
                  className="btn-secondary inline-flex items-center gap-1 px-2 py-1 text-xs"
                  onClick={() => onEliminar(item.id)}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdministracionDiasSinFormacionPage() {
  const [sedes, setSedes] = useState<SedeItem[]>([]);
  const [items, setItems] = useState<DiaSinFormacionSedeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [filterSedeId, setFilterSedeId] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sedesData, list] = await Promise.all([
        apiService.getCatalogosSedes(),
        apiService.getDiasSinFormacion(filterSedeId > 0 ? filterSedeId : undefined),
      ]);
      setSedes(sedesData);
      setItems(list);
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo cargar días sin formación'));
    } finally {
      setLoading(false);
    }
  }, [filterSedeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const guardar = async () => {
    if (!form.sede_id || !form.fecha_inicio || !form.fecha_fin || !form.motivo.trim()) {
      globalThis.alert('Complete sede, rango de fechas y motivo.');
      return;
    }
    setSaving(true);
    try {
      await apiService.createDiaSinFormacion({
        sede_id: form.sede_id,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        motivo: form.motivo.trim(),
      });
      setForm(emptyForm());
      await load();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo registrar el día sin formación'));
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (id: number) => {
    if (!globalThis.confirm('¿Eliminar este registro de día sin formación?')) return;
    try {
      await apiService.deleteDiaSinFormacion(id);
      await load();
    } catch (err: unknown) {
      globalThis.alert(axiosErrorMessage(err, 'No se pudo eliminar'));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
          <CalendarDaysIcon className="h-7 w-7 text-emerald-600" aria-hidden />
          Días sin formación por sede
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Registre PARO u otros motivos por sede. Esos días no cuentan para inasistencias ni permiten abrir sesión de
          asistencia.
        </p>
      </div>

      <div className="card space-y-4 p-4">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Nuevo registro</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="dsf-sede" className="mb-1 block text-xs text-gray-500">
              Sede
            </label>
            <select
              id="dsf-sede"
              className="input-field w-full"
              value={form.sede_id || ''}
              onChange={(e) => setForm({ ...form, sede_id: Number(e.target.value) })}
            >
              <option value="">Seleccione sede</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dsf-motivo" className="mb-1 block text-xs text-gray-500">
              Motivo (ej. PARO)
            </label>
            <input
              id="dsf-motivo"
              className="input-field w-full"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              maxLength={255}
            />
          </div>
          <div>
            <label htmlFor="dsf-inicio" className="mb-1 block text-xs text-gray-500">
              Fecha inicio
            </label>
            <input
              id="dsf-inicio"
              type="date"
              className="input-field w-full"
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="dsf-fin" className="mb-1 block text-xs text-gray-500">
              Fecha fin
            </label>
            <input
              id="dsf-fin"
              type="date"
              className="input-field w-full"
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
          </div>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={guardar} disabled={saving}>
          <PlusIcon className="h-4 w-4" aria-hidden />
          {saving ? 'Guardando…' : 'Registrar'}
        </button>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Registros</h2>
          <select
            className="input-field max-w-xs"
            value={filterSedeId || ''}
            onChange={(e) => setFilterSedeId(Number(e.target.value))}
            aria-label="Filtrar por sede"
          >
            <option value={0}>Todas las sedes</option>
            {sedes.map((s) => (
              <option key={`filter-${s.id}`} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
        {cuerpoTablaRegistros(loading, items, eliminar)}
      </div>
    </div>
  );
}
