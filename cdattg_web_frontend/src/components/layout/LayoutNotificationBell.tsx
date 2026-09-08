/**
 * Campana del header: muestra cuántas notificaciones quedan sin leer y un
 * listado corto. Al abrir marca las visibles como leídas y permite eliminar
 * una a una o vaciar todo el buzón (igual que en el submódulo de notificaciones).
 *
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useRef, useState } from 'react';
import { BellIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  contarNotificacionesNoLeidas,
  eliminarNotificacion,
  eliminarTodasNotificaciones,
  listarNotificaciones,
  marcarNotificacionLeida,
} from '../../services/notificacionApi';
import type { NotificacionItem } from '../../types/notificacion';

export function LayoutNotificationBell() {
  const [abierta, setAbierta] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [items, setItems] = useState<NotificacionItem[]>([]);
  const [error, setError] = useState('');
  const [confirmarTodas, setConfirmarTodas] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  const recargar = () => {
    void contarNotificacionesNoLeidas()
      .then(setNoLeidas)
      .catch(() => setNoLeidas(0));
  };

  useEffect(() => {
    recargar();
    const timer = globalThis.setInterval(recargar, 45000);
    return () => globalThis.clearInterval(timer);
  }, []);

  useEffect(() => {
    const cerrarFuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierta(false);
    };
    document.addEventListener('mousedown', cerrarFuera);
    return () => document.removeEventListener('mousedown', cerrarFuera);
  }, []);

  const abrir = async () => {
    setAbierta((v) => {
      if (v) return false;
      void listarNotificaciones()
        .then((r) => {
          setItems(r.items);
          r.items.filter((n) => !n.leida_en).forEach((n) => void marcarNotificacionLeida(n.id));
          recargar();
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error'));
      return true;
    });
  };

  const borrarUna = async (id: number) => {
    try {
      await eliminarNotificacion(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
      recargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No pude eliminar');
    }
  };

  const vaciarTodas = async () => {
    try {
      await eliminarTodasNotificaciones();
      setItems([]);
      setConfirmarTodas(false);
      recargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No pude vaciar el buzón');
    }
  };

  return (
    <div className="relative" ref={caja}>
      <button
        type="button"
        onClick={() => void abrir()}
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 py-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-primary-300 md:min-h-0 md:min-w-0"
        aria-label="Notificaciones"
      >
        <BellIcon className="h-5 w-5" />
        {noLeidas > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        ) : null}
      </button>
      {abierta ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificaciones</h3>
            {items.length > 0 ? (
              confirmarTodas ? (
                <span className="flex items-center gap-1">
                  <button type="button" className="btn-outline-danger px-2 py-1 text-xs" onClick={() => void vaciarTodas()}>
                    Sí, vaciar
                  </button>
                  <button type="button" className="btn-outline-gray px-2 py-1 text-xs" onClick={() => setConfirmarTodas(false)}>
                    No
                  </button>
                </span>
              ) : (
                <button type="button" className="btn-outline-danger px-2 py-1 text-xs" onClick={() => setConfirmarTodas(true)}>
                  Vaciar todo
                </button>
              )
            ) : null}
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {items.length === 0 ? (
            <p className="text-xs text-gray-500">No hay notificaciones.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-auto">
              {items.map((n) => (
                <li key={n.id} className="flex items-start gap-1 rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-white">
                      {n.leida_en ? null : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" aria-hidden />}
                      {n.titulo}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{n.mensaje}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void borrarUna(n.id)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    aria-label={`Eliminar ${n.titulo}`}
                  >
                    <TrashIcon className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}