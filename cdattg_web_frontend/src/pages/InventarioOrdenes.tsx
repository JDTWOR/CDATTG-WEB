import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import type { OrdenResponse, OrdenFromCarritoRequest, ProductoResponse, CarritoItem } from '../types';

export const InventarioOrdenes = () => {
  const { hasPermission } = useAuth();
  const [list, setList] = useState<OrdenResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [productos, setProductos] = useState<ProductoResponse[]>([]);
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [form, setForm] = useState<Pick<OrdenFromCarritoRequest, 'tipo' | 'descripcion' | 'fecha_devolucion'>>({
    tipo: 'salida',
    descripcion: '',
    fecha_devolucion: undefined,
  });

  const verTodas = hasPermission('VER TODAS LAS ORDENES');

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await apiService.getOrdenes(page, pageSize, verTodas);
      setList(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al cargar órdenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, verTodas]);

  useEffect(() => {
    if (modalOpen) {
      apiService.getProductos(1, 200).then((r) => setProductos(r.data)).catch(() => {});
      setCarrito([]);
      setForm({ tipo: 'salida', descripcion: '', fecha_devolucion: undefined });
    }
  }, [modalOpen]);

  const addToCarrito = (productoId: number, cantidad: number) => {
    if (cantidad < 1) return;
    setCarrito((prev) => {
      const idx = prev.findIndex((i) => i.producto_id === productoId);
      const next = idx >= 0 ? [...prev] : [...prev, { producto_id: productoId, cantidad: 0 }];
      if (idx >= 0) next[idx].cantidad += cantidad;
      else next[next.length - 1].cantidad = cantidad;
      return next;
    });
  };

  const removeFromCarrito = (productoId: number) => {
    setCarrito((prev) => prev.filter((i) => i.producto_id !== productoId));
  };

  const handleCreateOrden = async () => {
    if (!form.descripcion.trim()) {
      alert('La descripción es obligatoria.');
      return;
    }
    if (form.tipo === 'prestamo' && !form.fecha_devolucion) {
      alert('Para préstamo la fecha de devolución es obligatoria.');
      return;
    }
    if (carrito.length === 0) {
      alert('Agregue al menos un producto al carrito.');
      return;
    }
    try {
      await apiService.createOrdenFromCarrito({
        ...form,
        tipo: form.tipo,
        descripcion: form.descripcion,
        fecha_devolucion: form.tipo === 'prestamo' ? form.fecha_devolucion : undefined,
        carrito,
      });
      setModalOpen(false);
      fetchList();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear la orden');
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Órdenes</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Préstamos y salidas de inventario</p>
        </div>
        <div className="flex gap-2">
          <Link to="/inventario/ordenes/pendientes" className="btn-secondary">
            Pendientes de aprobación
          </Link>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            Nueva orden (desde carrito)
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay órdenes.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Solicitante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map((o) => (
                    <tr key={o.id} className="bg-white dark:bg-gray-900">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{o.numero_orden}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{o.tipo_orden}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${o.estado === 'EN_ESPERA' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                          {o.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{o.persona_nombre ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{new Date(o.fecha_orden).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/inventario/ordenes/${o.id}`} className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {page} de {totalPages} ({total} registros)
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary text-sm">
                    Anterior
                  </button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-secondary text-sm">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nueva orden desde carrito</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as 'prestamo' | 'salida' })}
                  className="input-field w-full"
                >
                  <option value="salida">Salida</option>
                  <option value="prestamo">Préstamo</option>
                </select>
              </div>
              {form.tipo === 'prestamo' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de devolución *</label>
                  <input
                    type="date"
                    value={form.fecha_devolucion ?? ''}
                    onChange={(e) => setForm({ ...form, fecha_devolucion: e.target.value || undefined })}
                    className="input-field w-full"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción *</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="input-field w-full"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Agregar producto</label>
                <div className="flex gap-2 flex-wrap">
                  {productos.slice(0, 20).map((p) => (
                    <div key={p.id} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                      <span className="text-sm">{p.name}</span>
                      <input
                        type="number"
                        min={1}
                        className="w-16 input-field text-sm"
                        placeholder="Cant."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const n = parseInt((e.target as HTMLInputElement).value, 10);
                            if (n >= 1) addToCarrito(p.id, n);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const q = parseInt(prompt('Cantidad:', '1') ?? '1', 10);
                          if (q >= 1) addToCarrito(p.id, q);
                        }}
                        className="text-primary-600 dark:text-primary-400 text-sm"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Carrito ({carrito.length} ítems)</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                  {carrito.map((item) => {
                    const prod = productos.find((pr) => pr.id === item.producto_id);
                    return (
                      <li key={item.producto_id} className="flex justify-between">
                        {prod?.name ?? item.producto_id} — {item.cantidad}
                        <button type="button" onClick={() => removeFromCarrito(item.producto_id)} className="text-red-600 dark:text-red-400">
                          Quitar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={handleCreateOrden} className="btn-primary">
                Crear orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
