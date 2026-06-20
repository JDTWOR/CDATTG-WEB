import { useCallback, useEffect, useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import { axiosErrorMessage } from '../../utils/httpError';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../utils/roles';
import type { ConfiguracionAsistenciaItem } from '../../types';

const ROLES_ADMIN = ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR'] as const;

export function AdministracionConfiguracionAsistenciaPage() {
  const { roles } = useAuth();
  const canManage = hasAnyRole(roles, [...ROLES_ADMIN]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<ConfiguracionAsistenciaItem>({
    plazo_edicion_observaciones_dias: 5,
    intervalo_auto_cierre_minutos: 5,
    minutos_alerta_sin_sesion: 90,
    minutos_extension_default: 60,
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getConfiguracionAsistencia();
      setForm(data);
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'No se pudo cargar la configuración.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    void cargar();
  }, [canManage, cargar]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await apiService.updateConfiguracionAsistencia(form);
      setForm(data);
      setSuccess('Configuración guardada correctamente.');
    } catch (err: unknown) {
      setError(axiosErrorMessage(err, 'No se pudo guardar la configuración.'));
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">No tiene permisos para administrar esta sección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          <Cog6ToothIcon className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Configuración de asistencia</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Parámetros globales de auto-cierre, alertas y extensión horaria por defecto.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : (
        <form onSubmit={guardar} className="card max-w-xl space-y-4 p-4">
          <div>
            <label htmlFor="plazo-obs" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plazo edición observaciones (días)
            </label>
            <input
              id="plazo-obs"
              type="number"
              min={1}
              max={365}
              required
              value={form.plazo_edicion_observaciones_dias}
              onChange={(e) =>
                setForm((f) => ({ ...f, plazo_edicion_observaciones_dias: Number(e.target.value) }))
              }
              className="input-field mt-1 w-full"
            />
            <p className="mt-1 text-xs text-gray-500">Días después de cerrar la sesión en que se pueden editar observaciones.</p>
          </div>

          <div>
            <label htmlFor="intervalo-cierre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Intervalo auto-cierre (minutos)
            </label>
            <input
              id="intervalo-cierre"
              type="number"
              min={1}
              max={1440}
              required
              value={form.intervalo_auto_cierre_minutos}
              onChange={(e) =>
                setForm((f) => ({ ...f, intervalo_auto_cierre_minutos: Number(e.target.value) }))
              }
              className="input-field mt-1 w-full"
            />
            <p className="mt-1 text-xs text-gray-500">Frecuencia con la que el sistema cierra sesiones vencidas.</p>
          </div>

          <div>
            <label htmlFor="alerta-sesion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Alerta sin sesión (minutos)
            </label>
            <input
              id="alerta-sesion"
              type="number"
              min={1}
              max={1440}
              required
              value={form.minutos_alerta_sin_sesion}
              onChange={(e) => setForm((f) => ({ ...f, minutos_alerta_sin_sesion: Number(e.target.value) }))}
              className="input-field mt-1 w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Minutos después del inicio de jornada para alertar si no hay sesión abierta.
            </p>
          </div>

          <div>
            <label htmlFor="extension-default" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Extensión post-fin por defecto (minutos)
            </label>
            <input
              id="extension-default"
              type="number"
              min={0}
              max={480}
              required
              value={form.minutos_extension_default}
              onChange={(e) => setForm((f) => ({ ...f, minutos_extension_default: Number(e.target.value) }))}
              className="input-field mt-1 w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Usado cuando la jornada no define extensión propia. Puede ser 0 para desactivar la ventana extra.
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </form>
      )}
    </div>
  );
}
