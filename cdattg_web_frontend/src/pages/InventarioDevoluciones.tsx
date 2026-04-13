import { useState, useEffect, useCallback, type ComponentProps } from 'react';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type { OrdenResponse, DetalleOrdenResponse, DevolucionCreateRequest } from '../types';

export const InventarioDevoluciones = () => {
  const [ordenes, setOrdenes] = useState<OrdenResponse[]>([]);
  const [detallesPendientes, setDetallesPendientes] = useState<DetalleOrdenResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<DevolucionCreateRequest>({
    detalle_orden_id: 0,
    cantidad_devuelta: 0,
    cierra_sin_stock: false,
    observaciones: '',
  });

  const fetchOrdenes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getOrdenes(1, 100, true);
      const list = res.data;
      setOrdenes(list);
      const detalles: DetalleOrdenResponse[] = [];
      list.forEach((o) => {
        o.detalle_ordenes?.forEach((d) => {
          if (d.estado === 'APROBADA' && d.pendiente_devolver > 0 && !d.cierra_sin_stock) {
            detalles.push(d);
          }
        });
      });
      setDetallesPendientes(detalles);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'Error al cargar órdenes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrdenes();
  }, [fetchOrdenes]);

  const selectedDetalle = detallesPendientes.find((d) => d.id === form.detalle_orden_id);

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (e) => {
    e.preventDefault();
    if (!form.detalle_orden_id) {
      alert('Seleccione un detalle de orden.');
      return;
    }
    if (!form.cierra_sin_stock && form.cantidad_devuelta < 0) {
      alert('La cantidad devuelta debe ser mayor o igual a 0.');
      return;
    }
    if (form.cierra_sin_stock && !form.observaciones?.trim()) {
      alert('Para cierre sin stock las observaciones son obligatorias.');
      return;
    }
    if (!form.cierra_sin_stock && selectedDetalle && form.cantidad_devuelta > selectedDetalle.pendiente_devolver) {
      alert(`La cantidad no puede superar la pendiente por devolver (${selectedDetalle.pendiente_devolver}).`);
      return;
    }
    void (async () => {
      try {
        await apiService.createDevolucion(form);
        setSuccess('Devolución registrada correctamente.');
        setForm({ detalle_orden_id: 0, cantidad_devuelta: 0, cierra_sin_stock: false, observaciones: '' });
        void fetchOrdenes();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: unknown) {
        alert(axiosErrorMessage(err, 'Error al registrar devolución'));
      }
    })();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Registrar devolución</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Registre la devolución de ítems de un préstamo aprobado</p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}
      {success && (
        <output
          aria-live="polite"
          className="block w-full rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-green-700 dark:text-green-300"
        >
          {success}
        </output>
      )}

      <div className="card max-w-xl">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label htmlFor="inv-dev-detalle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Detalle de orden (préstamo aprobado con pendiente) *
              </label>
              <select
                id="inv-dev-detalle"
                value={form.detalle_orden_id || ''}
                onChange={(e) => {
                  const id = Number.parseInt(e.target.value, 10);
                  const d = detallesPendientes.find((x) => x.id === id);
                  setForm({
                    ...form,
                    detalle_orden_id: id,
                    cantidad_devuelta: d?.pendiente_devolver ?? 0,
                  });
                }}
                className="input-field w-full"
                required
              >
                <option value="">Seleccione...</option>
                {detallesPendientes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.producto_nombre} — Pendiente: {d.pendiente_devolver} (Orden #{ordenes.find((o) => o.id === d.orden_id)?.numero_orden ?? d.orden_id})
                  </option>
                ))}
              </select>
              {detallesPendientes.length === 0 && !loading && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No hay detalles con pendiente por devolver.</p>
              )}
            </div>

            {selectedDetalle && (
              <>
                <div>
                  <label htmlFor="inv-dev-cantidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad devuelta *
                  </label>
                  <input
                    id="inv-dev-cantidad"
                    type="number"
                    min={0}
                    max={selectedDetalle.pendiente_devolver}
                    value={form.cantidad_devuelta}
                    onChange={(e) =>
                      setForm({ ...form, cantidad_devuelta: Number.parseInt(e.target.value, 10) || 0 })
                    }
                    className="input-field w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Máximo: {selectedDetalle.pendiente_devolver}. Use 0 solo para cierre sin stock (consumibles).</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cierra_sin_stock"
                    checked={form.cierra_sin_stock}
                    onChange={(e) => setForm({ ...form, cierra_sin_stock: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="cierra_sin_stock" className="text-sm text-gray-700 dark:text-gray-300">
                    Cierre sin stock (solo consumibles, cantidad 0)
                  </label>
                </div>
                <div>
                  <label htmlFor="inv-dev-observaciones" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observaciones {form.cierra_sin_stock ? '*' : '(opcional)'}
                  </label>
                  <textarea
                    id="inv-dev-observaciones"
                    value={form.observaciones ?? ''}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    className="input-field w-full"
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="pt-4">
              <button type="submit" className="btn-primary" disabled={!form.detalle_orden_id || detallesPendientes.length === 0}>
                Registrar devolución
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
