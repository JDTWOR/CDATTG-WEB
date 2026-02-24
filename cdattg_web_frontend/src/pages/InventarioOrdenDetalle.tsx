import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import type { OrdenResponse } from '../types';

export const InventarioOrdenDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const [orden, setOrden] = useState<OrdenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiService
      .getOrdenById(parseInt(id, 10))
      .then(setOrden)
      .catch(() => setError('Orden no encontrada'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>;
  if (error || !orden) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300">
        {error || 'Orden no encontrada'}
        <Link to="/inventario/ordenes" className="ml-2 underline">Volver a órdenes</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/inventario/ordenes" className="text-primary-600 dark:text-primary-400 hover:underline">
          ← Órdenes
        </Link>
      </div>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orden {orden.numero_orden}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{orden.descripcion}</p>
      </div>
      <div className="card p-6 space-y-4">
        <p><span className="font-medium text-gray-700 dark:text-gray-300">Tipo:</span> {orden.tipo_orden}</p>
        <p><span className="font-medium text-gray-700 dark:text-gray-300">Estado:</span> {orden.estado}</p>
        <p><span className="font-medium text-gray-700 dark:text-gray-300">Solicitante:</span> {orden.persona_nombre ?? '-'}</p>
        <p><span className="font-medium text-gray-700 dark:text-gray-300">Fecha orden:</span> {new Date(orden.fecha_orden).toLocaleString()}</p>
        {orden.fecha_devolucion && (
          <p><span className="font-medium text-gray-700 dark:text-gray-300">Fecha devolución:</span> {new Date(orden.fecha_devolucion).toLocaleDateString()}</p>
        )}
        <div>
          <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Detalle</p>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {orden.detalle_ordenes?.map((d) => (
              <li key={d.id} className="py-2 flex justify-between">
                <span>{d.producto_nombre ?? d.producto_id}</span>
                <span>{d.cantidad} (devuelto: {d.cantidad_devuelta}, pendiente: {d.pendiente_devolver}) — {d.estado}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
