import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { TipoObservacionAsistenciaItem } from '../types';

export const AsistenciaTiposObservacion = () => {
  const { roles } = useAuth();
  const [items, setItems] = useState<TipoObservacionAsistenciaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');

  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getTiposObservacionAsistencia();
      setItems(res);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al cargar tipos de observación.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      setError('Solo el superadministrador puede gestionar tipos de observación.');
      return;
    }
    cargar();
  }, [isSuperAdmin]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      setError('Código y nombre son obligatorios.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await apiService.createTipoObservacionAsistencia({
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        activo: true,
      });
      setCodigo('');
      setNombre('');
      await cargar();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear tipo de observación.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tipos de observación</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestione el catálogo de observaciones predefinidas para asistencia.
          </p>
        </div>
        <Link to="/asistencia" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a asistencia
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Crear nuevo tipo</h2>
        <form onSubmit={crear} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código</label>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="input-field w-full"
              placeholder="Ej: SIN_UNIFORME"
              maxLength={80}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="input-field w-full"
              placeholder="Ej: No trajo uniforme"
              maxLength={255}
            />
          </div>
          <div className="md:col-span-3">
            <button type="submit" disabled={saving || !isSuperAdmin} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
              <PlusIcon className="w-5 h-5" />
              {saving ? 'Creando...' : 'Crear tipo de observación'}
            </button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tipos activos</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Cargando...</div>
        ) : items.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No hay tipos de observación activos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{item.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
