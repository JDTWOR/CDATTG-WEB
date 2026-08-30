/**
 * API del carnet digital y de la validación del instructor líder.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { API_BASE_URL } from '../config/api';
import type {
  CarnetBibliotecaResponse,
  CarnetDigitalResponse,
  CarnetPendienteItem,
  CarnetVistaInstructor,
} from '../types/carnet';

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

/** Traigo el estado de mi carnet. */
export async function getMiCarnet(): Promise<CarnetDigitalResponse> {
  const res = await fetch(`${API_BASE_URL}/carnets/mi-carnet`, { headers: auth() });
  return leerJson(res, 'No pude cargar el carnet');
}

/** Pido crear o renovar el carnet de la ficha elegida. */
export async function solicitarMiCarnet(fichaId: number): Promise<CarnetDigitalResponse> {
  const res = await fetch(`${API_BASE_URL}/carnets/solicitar`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ficha_id: fichaId }),
  });
  return leerJson(res, 'No pude solicitar el carnet');
}

/** Foto publicada (la que validó el líder). */
export async function bajarFotoCarnet(fichaId?: number): Promise<Blob | null> {
  const q = fichaId ? `?ficha_id=${fichaId}` : '';
  const res = await fetch(`${API_BASE_URL}/carnets/mi-foto${q}`, { headers: auth() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('No pude cargar la foto del carnet');
  return res.blob();
}

/** Listado para el instructor líder. */
export async function listarCarnetsPendientes(): Promise<CarnetPendienteItem[]> {
  const res = await fetch(`${API_BASE_URL}/carnets/pendientes`, { headers: auth() });
  return leerJson(res, 'No pude cargar las solicitudes');
}

/** Apruebo o rechazo una solicitud. */
export async function decidirCarnet(id: number, aprobar: boolean, motivo = ''): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/carnets/${id}/decidir?aprobar=${aprobar ? '1' : '0'}`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  });
  await leerJson(res, 'No pude guardar la decisión');
}

export function urlFotoSolicitud(id: number): string {
  return `${API_BASE_URL}/carnets/${id}/foto`;
}

export function urlFotoBiblioteca(id: number): string {
  return `${API_BASE_URL}/carnets/biblioteca/${id}/foto`;
}

/** Listado de carnets regulares ya validados para biblioteca. */
export async function listarCarnetsBiblioteca(fichaId?: number): Promise<CarnetBibliotecaResponse> {
  const q = fichaId && fichaId > 0 ? `?ficha_id=${fichaId}` : '';
  const res = await fetch(`${API_BASE_URL}/carnets/biblioteca${q}`, { headers: auth() });
  return leerJson(res, 'No pude cargar los carnets de biblioteca');
}

/** Excel de biblioteca para la otra máquina o para bajarlo. */
export async function bajarExcelBiblioteca(fichaId?: number): Promise<Blob> {
  const q = fichaId && fichaId > 0 ? `?ficha_id=${fichaId}` : '';
  const res = await fetch(`${API_BASE_URL}/carnets/biblioteca/excel${q}`, { headers: auth() });
  if (!res.ok) {
    throw new Error('No pude bajar el Excel de biblioteca');
  }
  return res.blob();
}

/** Traigo el carnet completo de una solicitud para el líder. */
export async function getVistaSolicitud(id: number): Promise<CarnetVistaInstructor> {
  const res = await fetch(`${API_BASE_URL}/carnets/${id}`, { headers: auth() });
  return leerJson(res, 'No pude cargar la solicitud');
}
