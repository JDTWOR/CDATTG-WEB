import { useState, useEffect, useCallback } from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type {
  ProductoResponse,
  ProductoCreateRequest,
  ProductoUpdateRequest,
  CategoriaResponse,
  MarcaResponse,
  ProveedorResponse,
  ContratoConvenioResponse,
  AmbienteItem,
} from '../types';

function stockNivelBadgeClass(nivel: string | undefined): string {
  if (nivel === 'critico') {
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
  }
  if (nivel === 'bajo') {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

export const InventarioProductos = () => {
  const [list, setList] = useState<ProductoResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductoResponse | null>(null);
  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [marcas, setMarcas] = useState<MarcaResponse[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorResponse[]>([]);
  const [contratos, setContratos] = useState<ContratoConvenioResponse[]>([]);
  const [ambientes, setAmbientes] = useState<AmbienteItem[]>([]);
  const [form, setForm] = useState<Partial<ProductoCreateRequest>>({
    name: '',
    descripcion: '',
    cantidad: 1,
    tipo_producto_id: 1,
    unidad_medida_id: 1,
    estado_producto_id: 1,
    categoria_id: undefined,
    marca_id: undefined,
    contrato_convenio_id: undefined,
    ambiente_id: undefined,
    proveedor_id: undefined,
  });

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getProductos(page, pageSize);
      setList(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'Error al cargar productos'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const loadCatalogos = async () => {
    try {
      const [cat, mar, prov, cont, amb] = await Promise.all([
        apiService.getCategorias(),
        apiService.getMarcas(),
        apiService.getProveedores(1, 500).then((r) => r.data),
        apiService.getContratosConvenios(1, 500).then((r) => r.data),
        apiService.getCatalogosAmbientes(),
      ]);
      setCategorias(cat);
      setMarcas(mar);
      setProveedores(prov);
      setContratos(cont);
      setAmbientes(amb);
    } catch {
      // Catalogos opcionales para listados
    }
  };

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (modalOpen) loadCatalogos();
  }, [modalOpen]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      descripcion: '',
      cantidad: 1,
      tipo_producto_id: 1,
      unidad_medida_id: 1,
      estado_producto_id: 1,
      categoria_id: categorias[0]?.id,
      marca_id: marcas[0]?.id,
      contrato_convenio_id: contratos[0]?.id,
      ambiente_id: ambientes[0]?.id,
      proveedor_id: proveedores[0]?.id,
    });
    setModalOpen(true);
  };

  const openEdit = (p: ProductoResponse) => {
    setEditing(p);
    setForm({
      name: p.name,
      descripcion: p.descripcion,
      cantidad: p.cantidad,
      tipo_producto_id: p.tipo_producto_id ?? 1,
      unidad_medida_id: p.unidad_medida_id ?? 1,
      estado_producto_id: p.estado_producto_id ?? 1,
      categoria_id: p.categoria_id,
      marca_id: p.marca_id,
      contrato_convenio_id: p.contrato_convenio_id,
      ambiente_id: p.ambiente_id,
      proveedor_id: p.proveedor_id,
      codigo_barras: p.codigo_barras,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.descripcion || form.cantidad == null) {
      alert('Nombre, descripción y cantidad son obligatorios.');
      return;
    }
    if (!form.tipo_producto_id || !form.unidad_medida_id || !form.estado_producto_id || !form.categoria_id || !form.marca_id || !form.contrato_convenio_id || !form.ambiente_id) {
      alert('Complete todos los campos obligatorios (tipo, unidad, estado, categoría, marca, contrato, ambiente).');
      return;
    }
    if (!editing && !form.proveedor_id) {
      alert('El proveedor es obligatorio al crear.');
      return;
    }
    try {
      if (editing) {
        await apiService.updateProducto(editing.id, form as ProductoUpdateRequest);
      } else {
        await apiService.createProducto(form as ProductoCreateRequest);
      }
      setModalOpen(false);
      fetchList();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al guardar'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await apiService.deleteProducto(id);
      fetchList();
    } catch (err: unknown) {
      alert(axiosErrorMessage(err, 'Error al eliminar'));
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productos</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Catálogo de productos del inventario</p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          <span aria-hidden>+</span> Nuevo producto
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <caption className="sr-only">Catálogo de productos del inventario</caption>
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nivel</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map((p) => (
                    <tr key={p.id} className="bg-white dark:bg-gray-900">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{p.cantidad}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${stockNivelBadgeClass(p.nivel_stock)}`}>
                          {p.nivel_stock || 'normal'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded"
                          title="Editar"
                        >
                          <PencilSquareIcon className="w-5 h-5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-5 h-5" aria-hidden />
                        </button>
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
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="btn-secondary text-sm"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="btn-secondary text-sm"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar modal"
            onClick={() => setModalOpen(false)}
          />
          <dialog
            open
            aria-labelledby="inv-prod-modal-title"
            className="relative z-10 m-0 max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-600 dark:bg-gray-800"
          >
            <h2 id="inv-prod-modal-title" className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editing ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="inv-prod-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  id="inv-prod-name"
                  value={form.name ?? ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field w-full"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label htmlFor="inv-prod-descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción *
                </label>
                <textarea
                  id="inv-prod-descripcion"
                  value={form.descripcion ?? ''}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  className="input-field w-full"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label htmlFor="inv-prod-cantidad" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad *
                </label>
                <input
                  id="inv-prod-cantidad"
                  type="number"
                  min={editing ? 0 : 1}
                  value={form.cantidad ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, cantidad: Number.parseInt(e.target.value, 10) || 0 })
                  }
                  className="input-field w-full"
                />
              </div>
              <div>
                <label htmlFor="inv-prod-categoria" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría *
                </label>
                <select
                  id="inv-prod-categoria"
                  value={form.categoria_id ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, categoria_id: Number.parseInt(e.target.value, 10) || undefined })
                  }
                  className="input-field w-full"
                >
                  <option value="">Seleccione</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inv-prod-marca" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Marca *
                </label>
                <select
                  id="inv-prod-marca"
                  value={form.marca_id ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, marca_id: Number.parseInt(e.target.value, 10) || undefined })
                  }
                  className="input-field w-full"
                >
                  <option value="">Seleccione</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inv-prod-proveedor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Proveedor * (creación)
                </label>
                <select
                  id="inv-prod-proveedor"
                  value={form.proveedor_id ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, proveedor_id: Number.parseInt(e.target.value, 10) || undefined })
                  }
                  className="input-field w-full"
                >
                  <option value="">Seleccione</option>
                  {proveedores.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inv-prod-contrato" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contrato/Convenio *
                </label>
                <select
                  id="inv-prod-contrato"
                  value={form.contrato_convenio_id ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contrato_convenio_id: Number.parseInt(e.target.value, 10) || undefined,
                    })
                  }
                  className="input-field w-full"
                >
                  <option value="">Seleccione</option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inv-prod-ambiente" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ambiente *
                </label>
                <select
                  id="inv-prod-ambiente"
                  value={form.ambiente_id ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, ambiente_id: Number.parseInt(e.target.value, 10) || undefined })
                  }
                  className="input-field w-full"
                >
                  <option value="">Seleccione</option>
                  {ambientes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="inv-prod-tipo-producto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo producto ID
                  </label>
                  <input
                    id="inv-prod-tipo-producto"
                    type="number"
                    min={1}
                    value={form.tipo_producto_id ?? 1}
                    onChange={(e) =>
                      setForm({ ...form, tipo_producto_id: Number.parseInt(e.target.value, 10) || 1 })
                    }
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label htmlFor="inv-prod-unidad-medida" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unidad medida ID
                  </label>
                  <input
                    id="inv-prod-unidad-medida"
                    type="number"
                    min={1}
                    value={form.unidad_medida_id ?? 1}
                    onChange={(e) =>
                      setForm({ ...form, unidad_medida_id: Number.parseInt(e.target.value, 10) || 1 })
                    }
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label htmlFor="inv-prod-estado-producto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado producto ID
                  </label>
                  <input
                    id="inv-prod-estado-producto"
                    type="number"
                    min={1}
                    value={form.estado_producto_id ?? 1}
                    onChange={(e) =>
                      setForm({ ...form, estado_producto_id: Number.parseInt(e.target.value, 10) || 1 })
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="button" onClick={handleSave} className="btn-primary">
                Guardar
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
};
