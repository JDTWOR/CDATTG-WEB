import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import type { PersonaResponse } from '../types';

export const Perfil = () => {
  const { user, roles, permissions } = useAuth();
  const [persona, setPersona] = useState<PersonaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      if (!user.persona_id) {
        setLoading(false);
        return;
      }
      try {
        setError('');
        const p = await apiService.getPersonaById(user.persona_id);
        setPersona(p);
      } catch (e: unknown) {
        setError(axiosErrorMessage(e, 'No se pudo cargar la información de la persona.'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const fullName =
    persona?.full_name ||
    user?.full_name ||
    [persona?.primer_nombre, persona?.segundo_nombre, persona?.primer_apellido, persona?.segundo_apellido]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Aquí puedes consultar tus datos básicos, roles y permisos en el sistema.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-2xl font-semibold text-primary-700 dark:text-primary-300">
                {(fullName || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {loading && !fullName ? 'Cargando...' : fullName || 'Usuario sin nombre'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </p>
                {persona?.numero_documento && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Documento: {persona.numero_documento}
                  </p>
                )}
                <p className="mt-1 text-xs font-medium inline-flex items-center px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Estado de usuario: {user?.status ? 'Activo' : 'Inactivo'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Datos de contacto</h2>
            {loading && !persona && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Cargando datos de persona...</p>
            )}
            {!loading && !persona && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay persona vinculada a este usuario.
              </p>
            )}
            {persona && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Documento</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {persona.numero_documento}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Correo</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {persona.email || user?.email || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Celular</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {persona.celular || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Teléfono</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {persona.telefono || '—'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 dark:text-gray-400">Dirección</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {persona.direccion || '—'}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Roles asignados</h2>
            {roles.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay roles asignados a este usuario.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {roles.map((rol) => (
                  <li
                    key={rol}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
                  >
                    {rol}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Permisos efectivos
            </h2>
            {permissions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay permisos específicos asignados (se aplican solo los permisos por rol).
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900/40">
                <ul className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                  {permissions.map((perm) => (
                    <li key={perm} className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

