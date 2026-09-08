/**
 * Submódulo de Notificaciones: buzón completo del usuario con paginación.
 * Se abre igual que cualquier otro submódulo (debajo de "Mi perfil") y permite
 * eliminar una notificación a la vez o todo el buzón, como en la campana.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useCallback, useEffect, useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import {
  eliminarNotificacion,
  eliminarTodasNotificaciones,
  listarNotificaciones,
  marcarNotificacionLeida,
} from '../../services/notificacionApi';
import type { NotificacionItem } from '../../types/notificacion';

const POR_PAGINA = 15;

function fechaLegible(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

export function NotificacionesPage() {
  const [items, setItems] = useState<NotificacionItem[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [borrando, setBorrando] = useState(false);
  const [confirmarTodas, setConfirmarTodas] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const r = await listarNotificaciones(pagina);
      setItems(r.items);
      setTotalPaginas(Math.max(1, Math.ceil(r.total / POR_PAGINA)));
      r.items.filter((n) => !n.leida_en).forEach((n) => void marcarNotificacionLeida(n.id));
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setCargando(false);
    }
  }, [pagina]);

  useEffect(() => void cargar(), [cargar]);

  const borrarUna = async (id: number) => {
    try {
      setBorrando(true);
      await eliminarNotificacion(id);
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No pude eliminar');
    } finally {
      setBorrando(false);
    }
  };

  const borrarTodas = async () => {
    try {
      setBorrando(true);
      await eliminarTodasNotificaciones();
      setConfirmarTodas(false);
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No pude vaciar el buzón');
    } finally {
      setBorrando(false);
    }
  };

  return (
    <main className="page-container space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Notificaciones</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Sus avisos del sistema, uno a uno.</p>
        </div>
        {items.length > 0
          ? confirmarTodas
            ? (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-900/30">
                <span className="text-sm text-red-700 dark:text-red-300">¿Vaciar todo el buzón?</span>
                <button type="button" className="btn-outline-danger" onClick={() => void borrarTodas()} disabled={borrando}>Sí, vaciar</button>
                <button type="button" className="btn-outline-gray" onClick={() => setConfirmarTodas(false)} disabled={borrando}>Cancelar</button>
              </div>
            )
            : (
              <button type="button" className="btn-outline-danger" onClick={() => setConfirmarTodas(true)}><TrashIcon className="h-4 w-4" aria-hidden /> Vaciar todo</button>
            )
          : null}
      </header>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p> : null}

      {cargando ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No hay notificaciones.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-800">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{n.titulo}</p>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{n.mensaje}</p>
                <time className="mt-1 block text-xs text-gray-400" dateTime={n.created_at}>
                  {fechaLegible(n.created_at)}
                </time>
              </div>
              <button
                type="button"
                onClick={() => void borrarUna(n.id)}
                className="btn-outline-danger shrink-0 px-2 py-1.5 text-xs"
                aria-label={`Eliminar ${n.titulo}`}
                disabled={borrando}
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPaginas > 1 ? (
        <nav className="flex items-center gap-2" aria-label="Paginación">
          <button
            type="button"
            className="btn-outline-gray"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
          >Anterior</button>
          <span className="text-sm text-gray-600 dark:text-gray-300">Página {pagina} de {totalPaginas}</span>
          <button
            type="button"
            className="btn-outline-gray"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
          >Siguiente</button>
        </nav>
      ) : null}
    </main>
  );
}