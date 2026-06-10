import axios from 'axios';

const MENSAJES_GENERICOS_FALLBACK = new Set([
  'error al registrar asistencia',
  'network error',
  'request failed with status code 400',
  'request failed with status code 403',
  'request failed with status code 404',
  'request failed with status code 500',
]);

function textoUtilizable(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extraerDeObjeto(data: Record<string, unknown>): string | null {
  const directos = [data.details, data.error, data.message, data.msg, data.mensaje];
  for (const candidato of directos) {
    const texto = textoUtilizable(candidato);
    if (texto) return texto;
  }

  if (data.error && typeof data.error === 'object' && data.error !== null) {
    const nested = data.error as Record<string, unknown>;
    return textoUtilizable(nested.message) ?? textoUtilizable(nested.error);
  }

  return null;
}

function esMensajeErrorInterno(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    MENSAJES_GENERICOS_FALLBACK.has(lower) ||
    lower.includes('.catch is not a function') ||
    lower.includes('swal.fire')
  );
}

function mensajeDesdeRespuestaAxios(data: unknown, fallback: string, status?: number): string | null {
  if (typeof data === 'string') {
    return textoUtilizable(data);
  }

  if (data && typeof data === 'object') {
    const extraido = extraerDeObjeto(data as Record<string, unknown>);
    if (extraido) return extraido;
  }

  if (status) {
    return `${fallback} (HTTP ${status})`;
  }

  return null;
}

/** Mensaje de error de respuestas Axios típicas (error / details / message). */
export function axiosErrorMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const desdeApi = mensajeDesdeRespuestaAxios(e.response?.data, fallback, e.response?.status);
    if (desdeApi) return desdeApi;
  }

  if (e instanceof Error) {
    const msg = e.message.trim();
    if (msg && !esMensajeErrorInterno(msg)) {
      return msg;
    }
  }

  return fallback;
}
