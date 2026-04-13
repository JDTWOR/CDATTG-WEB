import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type { UsuarioListItem, UsuarioPermisosResponse, DefinicionesPermisosResponse } from '../types';

const PAGE_SIZE = 20;

type UsuarioPermisosDetallePanelProps = Readonly<{
  targetUserId: number;
  list: UsuarioListItem[];
  loadingDetalle: boolean;
  detalle: UsuarioPermisosResponse | null;
  definiciones: DefinicionesPermisosResponse | null;
  message: string;
  esYo: boolean;
  saving: boolean;
  isSuperAdmin: boolean;
  onToggleEstado: () => void;
  onSetRoles: (roles: string[]) => void;
  onQuitarPermiso: (obj: string, act: string) => void;
  onAsignarPermiso: (obj: string, act: string) => void;
}>;

function UsuarioPermisosDetallePanel({
  targetUserId,
  list,
  loadingDetalle,
  detalle,
  definiciones,
  message,
  esYo,
  saving,
  isSuperAdmin,
  onToggleEstado,
  onSetRoles,
  onQuitarPermiso,
  onAsignarPermiso,
}: UsuarioPermisosDetallePanelProps) {
  const usuario = list.find((u) => u.id === targetUserId);

  if (loadingDetalle) {
    return <p className="text-gray-500 dark:text-gray-400">Cargando...</p>;
  }
  if (!detalle) {
    return <p className="text-gray-500">No se pudo cargar el detalle.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3 mb-2">
          <UserCircleIcon className="w-10 h-10 text-gray-500" aria-hidden />
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{detalle.full_name || usuario?.full_name || `Usuario #${targetUserId}`}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{detalle.email ?? usuario?.email}</p>
            <p className="text-xs text-gray-500">
              Documento: {detalle.numero_documento ?? usuario?.numero_documento ?? '—'} · Estado: {(detalle.status ?? usuario?.status) ? 'Activo' : 'Inactivo'}
            </p>
          </div>
        </div>
        {message && (
          <p
            role={message.startsWith('Error') ? 'alert' : 'status'}
            className={`text-sm mb-2 ${message.startsWith('Error') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
          >
            {message}
          </p>
        )}
        {esYo ? (
          <p className="text-amber-600 dark:text-amber-400 text-sm">No puedes modificar tus propios permisos ni roles.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                onToggleEstado();
              }}
              disabled={saving}
              className="btn-secondary text-sm"
            >
              {(detalle.status ?? usuario?.status) ? 'Inactivar usuario' : 'Activar usuario'}
            </button>
          </div>
        )}
      </div>

      {isSuperAdmin && !esYo && definiciones && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Roles asignados</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Selecciona los roles que tendrá el usuario (reemplaza los actuales).</p>
          <div className="flex flex-wrap gap-2">
            {definiciones.roles.map((rol) => {
              const tiene = detalle.roles.includes(rol);
              return (
                <button
                  key={rol}
                  type="button"
                  onClick={() => {
                    const newRoles = tiene ? detalle.roles.filter((r) => r !== rol) : [...detalle.roles, rol];
                    onSetRoles(newRoles);
                  }}
                  disabled={saving}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    tiene
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  {rol}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Permisos (por roles + directos)</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Lista agregada de permisos que tiene el usuario. Los directos se pueden quitar abajo.
        </p>
        <div className="flex flex-wrap gap-2">
          {detalle.permisos.map((p) => (
            <span key={p} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-800 dark:text-gray-200">
              {p}
            </span>
          ))}
        </div>
      </div>

      {!esYo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Permisos directos</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Permisos asignados directamente al usuario (sin rol). Puedes añadir o quitar.
          </p>
          {detalle.directos.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {detalle.directos.map((d) => (
                <span key={`${d.obj}-${d.act}`} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/40 rounded text-sm">
                  {d.obj} → {d.act}
                  <button
                    type="button"
                    onClick={() => {
                      onQuitarPermiso(d.obj, d.act);
                    }}
                    disabled={saving}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 ml-1"
                    aria-label={`Quitar permiso ${d.obj} ${d.act}`}
                  >
                    <span aria-hidden>×</span>
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">Ninguno.</p>
          )}
          {definiciones && (
            <div>
              <label htmlFor="perm-add-directo-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Añadir permiso directo
              </label>
              <select
                id="perm-add-directo-select"
                className="input-field max-w-md"
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  e.target.value = '';
                  if (!v) return;
                  const [obj, act] = v.split('\0');
                  if (obj && act) onAsignarPermiso(obj, act);
                }}
                disabled={saving}
              >
                <option value="">— Seleccionar —</option>
                {definiciones.permisos.map((p) => (
                  <option key={`${p.obj}-${p.act}`} value={`${p.obj}\0${p.act}`}>
                    {p.obj} — {p.act}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Permisos() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, roles, hasPermission } = useAuth();
  const isSuperAdmin = roles.includes('SUPER ADMINISTRADOR');

  const [list, setList] = useState<UsuarioListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detalle, setDetalle] = useState<UsuarioPermisosResponse | null>(null);
  const [definiciones, setDefiniciones] = useState<DefinicionesPermisosResponse | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const currentUserId = currentUser?.id;
  const targetUserId = userId ? Number.parseInt(userId, 10) : null;
  const esYo = currentUserId != null && targetUserId !== null && currentUserId === targetUserId;

  // Listado de usuarios
  useEffect(() => {
    if (!hasPermission('ASIGNAR PERMISOS')) {
      setError('No tiene permiso para gestionar permisos.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    apiService
      .getUsuarios(offset, PAGE_SIZE, search)
      .then((res) => {
        setList(res.data);
        setTotal(res.total);
      })
      .catch((err: unknown) => setError(axiosErrorMessage(err, 'Error al cargar usuarios')))
      .finally(() => setLoading(false));
  }, [offset, search, hasPermission]);

  // Detalle y definiciones cuando hay userId
  useEffect(() => {
    if (!targetUserId || !hasPermission('ASIGNAR PERMISOS')) {
      setDetalle(null);
      return;
    }
    setLoadingDetalle(true);
    setDefiniciones(null);
    Promise.all([apiService.getUsuarioPermisos(targetUserId), apiService.getPermisosDefiniciones()])
      .then(([permisosRes, defRes]) => {
        setDetalle(permisosRes);
        setDefiniciones(defRes);
      })
      .catch((err: unknown) => setError(axiosErrorMessage(err, 'Error al cargar detalle')))
      .finally(() => setLoadingDetalle(false));
  }, [targetUserId, hasPermission]);

  const handleAsignarPermiso = async (obj: string, act: string) => {
    if (!targetUserId || esYo || saving) return;
    setSaving(true);
    setMessage('');
    try {
      await apiService.asignarPermiso(targetUserId, obj, act);
      setMessage('Permiso asignado.');
      const res = await apiService.getUsuarioPermisos(targetUserId);
      setDetalle(res);
    } catch (err: unknown) {
      setMessage(axiosErrorMessage(err, 'Error al asignar'));
    } finally {
      setSaving(false);
    }
  };

  const handleQuitarPermiso = async (obj: string, act: string) => {
    if (!targetUserId || esYo || saving) return;
    setSaving(true);
    setMessage('');
    try {
      await apiService.quitarPermiso(targetUserId, obj, act);
      setMessage('Permiso quitado.');
      const res = await apiService.getUsuarioPermisos(targetUserId);
      setDetalle(res);
    } catch (err: unknown) {
      setMessage(axiosErrorMessage(err, 'Error al quitar'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetRoles = async (newRoles: string[]) => {
    if (!targetUserId || esYo || saving) return;
    setSaving(true);
    setMessage('');
    try {
      await apiService.setUsuarioRoles(targetUserId, newRoles);
      setMessage('Roles actualizados.');
      const res = await apiService.getUsuarioPermisos(targetUserId);
      setDetalle(res);
    } catch (err: unknown) {
      setMessage(axiosErrorMessage(err, 'Error al guardar roles'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEstado = async () => {
    if (!targetUserId || esYo || saving) return;
    setSaving(true);
    setMessage('');
    try {
      await apiService.toggleUsuarioEstado(targetUserId);
      setMessage('Estado actualizado.');
      const res = await apiService.getUsuarioPermisos(targetUserId);
      setDetalle(res);
      // Actualizar listado por si cambió status
      const listRes = await apiService.getUsuarios(offset, PAGE_SIZE, search);
      setList(listRes.data);
    } catch (err: unknown) {
      setMessage(axiosErrorMessage(err, 'Error al cambiar estado'));
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('ASIGNAR PERMISOS')) {
    return (
      <div
        role="alert"
        className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-amber-800 dark:text-amber-200"
      >
        No tiene permiso para acceder a esta sección.
      </div>
    );
  }

  if (userId && targetUserId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/permisos"
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
            aria-label="Volver al listado de permisos"
          >
            <ArrowLeftIcon className="w-5 h-5" aria-hidden />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheckIcon className="w-6 h-6" aria-hidden />
            Permisos y roles
          </h1>
        </div>

        <UsuarioPermisosDetallePanel
          targetUserId={targetUserId}
          list={list}
          loadingDetalle={loadingDetalle}
          detalle={detalle}
          definiciones={definiciones}
          message={message}
          esYo={esYo}
          saving={saving}
          isSuperAdmin={isSuperAdmin}
          onToggleEstado={handleToggleEstado}
          onSetRoles={handleSetRoles}
          onQuitarPermiso={handleQuitarPermiso}
          onAsignarPermiso={handleAsignarPermiso}
        />
      </div>
    );
  }

  // Listado de usuarios
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <ShieldCheckIcon className="w-6 h-6" aria-hidden />
        Permisos y roles
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Seleccione un usuario para ver y editar sus roles y permisos directos. Solo usuarios con permiso ASIGNAR PERMISOS pueden acceder. Solo SUPER ADMINISTRADOR puede asignar roles.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <label htmlFor="perm-buscar-usuarios" className="sr-only">
          Buscar usuarios por nombre, documento o correo
        </label>
        <input
          id="perm-buscar-usuarios"
          type="search"
          placeholder="Buscar por nombre, documento, correo..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOffset(0);
          }}
          className="input-field flex-1 max-w-md"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {loading && <p className="text-gray-500">Cargando usuarios...</p>}
      {!loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <caption className="sr-only">Usuarios del sistema</caption>
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Documento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Roles</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{u.full_name || u.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{u.numero_documento || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {u.roles.length ? u.roles.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.status ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'}`}>
                        {u.status ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/permisos/${u.id}`}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 font-medium text-sm"
                      >
                        Ver permisos
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {total > PAGE_SIZE && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                  disabled={offset + PAGE_SIZE >= total}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
