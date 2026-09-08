/**
 * API de lectura de notificaciones para la campana del header.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { API_BASE_URL } from '../config/api';
import type { NotificacionesResponse } from '../types/notificacion';

function auth(): HeadersInit {
  return { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` };
}

async function leerJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? fallback);
  }
  return res.json() as Promise<T>;
}

/** Listado de notificaciones del usuario. */
export async function listarNotificaciones(pagina = 1): Promise<NotificacionesResponse> {
  const res = await fetch(`${API_BASE_URL}/notificaciones?page=${pagina}&per_page=15`, { headers: auth() });
  return leerJson(res, 'No pude cargar notificaciones');
}

/** Cuántas quedan sin leer. */
export async function contarNotificacionesNoLeidas(): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/notificaciones/no-leidas`, { headers: auth() });
  const json = await leerJson<{ no_leidas: number }>(res, 'No pude contar notificaciones');
  return json.no_leidas;
}

/** Marco una notificación como leída. */
export async function marcarNotificacionLeida(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notificaciones/${id}/leida`, {
    method: 'PUT',
    headers: auth(),
  });
  await leerJson(res, 'No pude marcar la notificación');
}

/** Elimino una notificación del buzón. */
export async function eliminarNotificacion(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notificaciones/${id}`, { method: 'DELETE', headers: auth() });
  await leerJson(res, 'No pude eliminar la notificación');
}

/** Vacío el buzón completo de notificaciones. */
export async function eliminarTodasNotificaciones(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notificaciones`, { method: 'DELETE', headers: auth() });
  await leerJson(res, 'No pude vaciar las notificaciones');
}