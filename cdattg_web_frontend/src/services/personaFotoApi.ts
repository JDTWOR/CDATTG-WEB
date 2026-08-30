/**
 * Subo y bajo la foto de perfil con el token de la sesión.
 * Lo separé de api.ts para no seguir creciendo ese archivo.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { API_BASE_URL } from '../config/api';
import type { PersonaResponse } from '../types';

function tokenSesion(): string {
  return localStorage.getItem('token') ?? '';
}

/**
 * Traigo los bytes de mi foto. Si no hay, devuelvo null.
 * @returns blob o null
 */
export async function bajarMiFoto(): Promise<Blob | null> {
  const res = await fetch(`${API_BASE_URL}/personas/mi-foto`, {
    headers: { Authorization: `Bearer ${tokenSesion()}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('No pude cargar la foto');
  return res.blob();
}

/**
 * Subo la foto ya sin fondo.
 * @param archivo png o jpg
 * @returns persona actualizada
 */
export async function subirMiFoto(archivo: Blob): Promise<PersonaResponse> {
  const body = new FormData();
  body.append('file', archivo, 'foto.png');
  const res = await fetch(`${API_BASE_URL}/personas/mi-foto`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenSesion()}` },
    body,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? 'No pude guardar la foto');
  }
  return res.json() as Promise<PersonaResponse>;
}
