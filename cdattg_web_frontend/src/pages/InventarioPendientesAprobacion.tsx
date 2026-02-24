import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { OrdenResponse, AprobarRechazarRequest } from '../types';

export const InventarioPendientesAprobacion = () => {
  const [list, setList] = useState<OrdenResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);
  const [rechazoModal, setRechazoModal] = useState<{ ordenId: number; detalleId?: number } | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await apiService.getOrdenesPendientesAprobacion(page, pageSize);
      setList(res.data);
      setTotal(res.total);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al cargar pendientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page]);

  const handleAprobarRechazar = async (req: AprobarRechazarRequest) => {
    try {
      setProcessing(req.orden_id);
      await apiService.aprobarRechazarOrden(req);
      setRechazoModal(null);
      setMotivoRechazo('');
      fetchList();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al procesar');
    } finally {
      setProcessing(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pendientes de aprobación</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Órdenes en espera de aprobación o rechazo</p>
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
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">No hay órdenes pendientes de aprobación.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Solicitante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Detalles</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map((o) => (
                    <tr key={o.id} className="bg-white dark:bg-gray-900">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{o.numero_orden}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{o.tipo_orden}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{o.persona_nombre ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {o.detalle_ordenes?.filter((d) => d.estado === 'EN_ESPERA').length ?? 0} en espera
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleAprobarRechazar({ orden_id: o.id, aprobar: true })}
                          disabled={processing !== null}
                          className="mr-2 px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Aprobar toda
                        </button>
                        <button
                          onClick={() => setRechazoModal({ ordenId: o.id })}
                          disabled={processing !== null}
                          className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Rechazar toda
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

      {rechazoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setRechazoModal(null); setMotivoRechazo(''); }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Rechazar orden</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Opcional: indique el motivo del rechazo.</p>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              className="input-field w-full mb-4"
              rows={3}
              placeholder="Motivo..."
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setRechazoModal(null); setMotivoRechazo(''); }} className="btn-secondary">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAprobarRechazar({
                    orden_id: rechazoModal.ordenId,
                    detalle_orden_id: rechazoModal.detalleId,
                    aprobar: false,
                    observaciones: motivoRechazo,
                  })
                }
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
