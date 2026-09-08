/**
 * API del submódulo de reposición de carnet por pérdida.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { API_BASE_URL } from '../config/api';
import type {
  CarnetPerdidaItem,
  CarnetPerdidaListadoResponse,
} from '../types/carnetPerdida';

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

/** Creo la solicitud con los dos PDFs (multipart). */
export async function crearSolicitudPerdida(
  fichaId: number,
  pago: File,
  demanda: File,
): Promise<CarnetPerdidaItem> {
  const form = new FormData();
  form.append('ficha_id', String(fichaId));
  form.append('comprobante_pago', pago);
  form.append('comprobante_demanda', demanda);
  const res = await fetch(`${API_BASE_URL}/carnets/perdida`, {
    method: 'POST',
    headers: auth(),
    body: form,
  });
  return leerJson(res, 'No pude enviar la solicitud');
}

/** Historial del aprendiz autenticado. */
export async function listarMiHistorialPerdida(): Promise<CarnetPerdidaItem[]> {
  const res = await fetch(`${API_BASE_URL}/carnets/perdida/mi-historial`, { headers: auth() });
  const json = await leerJson<{ items: CarnetPerdidaItem[] }>(res, 'No pude cargar el historial');
  return json.items;
}

/** Bandeja del bibliotecario por estado. */
export async function listarRevisionesPerdida(
  estado: string,
  pagina = 1,
): Promise<CarnetPerdidaListadoResponse> {
  const res = await fetch(
    `${API_BASE_URL}/carnets/perdida/revisiones?estado=${estado}&page=${pagina}`,
    { headers: auth() },
  );
  return leerJson(res, 'No pude cargar las solicitudes');
}

/** Acepto o devuelvo la solicitud. */
export async function decidirSolicitudPerdida(
  id: number,
  aprobar: boolean,
  motivo = '',
): Promise<CarnetPerdidaItem> {
  const res = await fetch(`${API_BASE_URL}/carnets/perdida/${id}/decidir`, {
    method: 'POST',
    headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ aprobar, motivo }),
  });
  return leerJson(res, 'No pude guardar la decisión');
}

/** Marco la reposición como renovada y entregada (pasa al historial). */
export async function renovarSolicitudPerdida(id: number): Promise<CarnetPerdidaItem> {
  const res = await fetch(`${API_BASE_URL}/carnets/perdida/${id}/renovar`, {
    method: 'POST',
    headers: auth(),
  });
  return leerJson(res, 'No pude marcar la reposición como renovada');
}

/** Aviso al aprendiz que su carnet renovado ya está listo para recoger. */
export async function notificarDisponiblePerdida(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/carnets/perdida/${id}/notificar-disponible`, {
    method: 'POST',
    headers: auth(),
  });
  await leerJson(res, 'No pude notificar al aprendiz');
}

/**
 * Descargo un archivo protegido con el token de la sesión y lo abro en otra
 * pestaña. Así el enlace nunca va sin cabecera Authorization (evita el 401).
 */
export async function abrirBlobProtegido(url: string, mensaje: string): Promise<void> {
  const res = await fetch(url, { headers: auth() });
  if (!res.ok) throw new Error(mensaje);
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  window.open(objUrl, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
}

/** Abro un comprobante (pago o demanda) en otra pestaña. */
export async function abrirComprobantePerdida(id: number, tipo: 'pago' | 'demanda'): Promise<void> {
  return abrirBlobProtegido(
    `${API_BASE_URL}/carnets/perdida/${id}/comprobante?tipo=${tipo}`,
    'No pude abrir el comprobante',
  );
}

/** Descargo el ZIP con los dos comprobantes en otra pestaña. */
export async function abrirComprobantesZipPerdida(id: number): Promise<void> {
  return abrirBlobProtegido(
    `${API_BASE_URL}/carnets/perdida/${id}/comprobantes/zip`,
    'No pude descargar el ZIP',
  );
}

/** Descargo el ZIP con la foto del solicitante. */
export async function abrirFotoZipPerdida(id: number): Promise<void> {
  return abrirBlobProtegido(
    `${API_BASE_URL}/carnets/perdida/${id}/foto/zip`,
    'No pude descargar el ZIP de la foto',
  );
}

function urlFotoPerdida(id: number): string {
  return `${API_BASE_URL}/carnets/perdida/${id}/foto`;
}

/** Bajo la foto del solicitante para la bandeja. Sin foto devuelvo null. */
export async function bajarFotoPerdida(id: number): Promise<Blob | null> {
  const res = await fetch(urlFotoPerdida(id), { headers: auth() });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('No pude cargar la foto del solicitante');
  return res.blob();
}