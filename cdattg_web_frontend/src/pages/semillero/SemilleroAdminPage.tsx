/**
 * Esta es la lista de semilleros para quien administra (ya con sesión).
 * Desde aquí se crea, edita o se va a presentación y revista.
 * No es el listado público de /investigacion/semilleros.
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import { AppLink } from '../../components/AppLink';
import { portalApi } from '../../services/portalApi';
import { semilleroAdminPaths } from '../../routes/paths';
import { axiosErrorMessage } from '../../utils/httpError';
import type { SemilleroItem } from '../../types/portal';

/**
 * Administración de semilleros: listar, editar y eliminar.
 * @returns La pantalla /admin de semilleros
 */
export function SemilleroAdminPage() {
  const [rows, setRows] = useState<SemilleroItem[]>([]);
  const [error, setError] = useState('');

  async function cargar() {
    try {
      setRows(await portalApi.listarSemillerosAdmin());
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudieron listar los semilleros'));
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function borrar(id: number) {
    // confirm del navegador: si dice que no, no llamo al API.
    if (!globalThis.confirm('¿Eliminar este semillero?')) return;
    try {
      await portalApi.eliminarSemillero(id);
      await cargar();
    } catch (cause: unknown) {
      setError(axiosErrorMessage(cause, 'No se pudo eliminar'));
    }
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Semilleros</h1>
        <nav className="flex gap-2">
          <AppLink path={semilleroAdminPaths.nuevo} className="btn-primary">Nuevo semillero</AppLink>
        </nav>
      </header>
      {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</p> : null}
      <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
        {rows.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <p>
              {/* Si tiene sigla, la pongo delante (SCBA · nombre). */}
              <span className="font-medium text-gray-900 dark:text-white">{s.sigla ? `${s.sigla} · ` : ''}{s.nombre}</span>
              <span className="ml-2 text-xs uppercase text-gray-500">{s.estado_publicacion}</span>
            </p>
            <p className="flex gap-2">
              <AppLink path={semilleroAdminPaths.editar(s.id)} className="btn-secondary">Editar</AppLink>
              <button type="button" className="btn-danger" onClick={() => void borrar(s.id)}>Eliminar</button>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
