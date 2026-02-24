import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, UserGroupIcon, ChartBarIcon, SignalIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getAsistenciaDashboardWsUrl } from '../config/api';
import type { AsistenciaDashboardResponse } from '../types';

export const AsistenciaDashboard = () => {
  const { token, roles } = useAuth();
  const [data, setData] = useState<AsistenciaDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');

  const fetchDashboard = async () => {
    try {
      setError('');
      const res = await apiService.getAsistenciaDashboard();
      setData(res);
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 403) {
        setError('Solo el superadministrador puede ver este dashboard.');
      } else {
        setError(err.response?.data?.error || 'Error al cargar el dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      setError('Solo el superadministrador puede acceder.');
      return;
    }
    fetchDashboard();
  }, [isSuperAdmin]);

  // WebSocket para actualizaciones en tiempo real
  useEffect(() => {
    if (!isSuperAdmin || !token) return;

    const connect = () => {
      const url = getAsistenciaDashboardWsUrl(token);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        // Reconectar tras 5 s
        reconnectRef.current = setTimeout(connect, 5000);
      };
      ws.onerror = () => {
        ws.close();
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (msg?.type === 'refresh') fetchDashboard();
        } catch {
          // ignorar
        }
      };
    };

    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [isSuperAdmin, token]);

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <p className="text-red-600 dark:text-red-400">Solo el superadministrador puede acceder al dashboard de asistencia.</p>
        <Link to="/asistencia" className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" />
          Volver a Asistencia
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Inicio</Link>
        <span>/</span>
        <Link to="/asistencia" className="hover:text-primary-600 dark:hover:text-primary-400">Asistencia</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium">Dashboard</span>
      </nav>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChartBarIcon className="w-8 h-8 text-primary-600" />
            Dashboard de Asistencia
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Números en tiempo real: aprendices en formación hoy (sede modelo / todo el SENA)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <SignalIcon className="w-4 h-4" />
              En vivo
            </span>
          )}
          <Link to="/asistencia" className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeftIcon className="w-5 h-5" />
            Tomar asistencia
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-8 text-center text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{data.fecha}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Aprendices en formación hoy</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">{data.total_aprendices_en_formacion}</p>
                </div>
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fichas con sesión hoy</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{data.por_ficha.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Por ficha (vinieron a formación hoy)</h2>
            {data.por_ficha.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No hay sesiones de asistencia registradas para hoy.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ficha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sede</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vinieron hoy</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {data.por_ficha.map((row) => (
                      <tr key={row.ficha_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.ficha_numero}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{row.sede_nombre || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-primary-600 dark:text-primary-400">{row.cantidad_vinieron}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
