import Swal, { type SweetAlertOptions } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import type { AsistenciaAprendizResponse } from '../../types';
import {
  interpretarMensajeRegistroAsistencia,
  interpretarRespuestaRegistroAsistencia,
  esMensajeReboteTexto,
} from './asistenciaRegistroMensajes';

const toastBase = {
  toast: true,
  position: 'bottom-end' as const,
  showConfirmButton: false,
  timerProgressBar: true,
  width: '26rem',
};

function esThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'then' in value &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  );
}

/** No asumir que Swal.fire devuelve Promise (evita `.catch is not a function` en producción). */
function fireToast(config: SweetAlertOptions): void {
  try {
    const result = Swal.fire(config);
    if (esThenable(result)) {
      void Promise.resolve(result).catch(() => {
        /* toast cerrado antes de resolver */
      });
    }
  } catch {
    /* ignorar fallo al mostrar toast */
  }
}

function escapeHtml(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function etiquetaTipoRegistro(tipo?: string): string {
  if (tipo === 'ingreso') return 'Entrada';
  if (tipo === 'salida') return 'Salida';
  return 'Asistencia';
}

function nombreAprendiz(data: AsistenciaAprendizResponse): string {
  return data.aprendiz_nombre?.trim() || data.numero_documento?.trim() || 'Aprendiz';
}

/** Toast con título + motivo (`text` y `html` por compatibilidad con SweetAlert2). */
function mostrarToastConMotivo(
  icon: 'success' | 'error' | 'warning' | 'info',
  titulo: string,
  motivo: string,
  timer = 7000,
): void {
  const motivoSeguro = escapeHtml(motivo.trim() || titulo);
  const textoMotivo = motivo.trim() || titulo;
  fireToast({
    ...toastBase,
    icon,
    title: titulo,
    text: textoMotivo,
    html: `<p style="margin:0.4rem 0 0;font-size:0.9rem;font-weight:500;line-height:1.45;color:#1f2937;text-align:left"><strong>Motivo:</strong> ${motivoSeguro}</p>`,
    timer,
  });
}

export function mostrarToastRegistroAsistencia(data: AsistenciaAprendizResponse): void {
  const tipo = etiquetaTipoRegistro(data.tipo_registro);
  const nombre = nombreAprendiz(data);
  const icon = data.tipo_registro === 'salida' ? 'info' : 'success';

  fireToast({
    ...toastBase,
    icon,
    title: `${tipo} guardada`,
    text: nombre,
    html: `<p style="margin:0.35rem 0 0;font-size:0.875rem;color:#1f2937;text-align:left">${escapeHtml(nombre)}</p>`,
    timer: 2500,
  });
}

export function mostrarToastErrorAsistencia(titulo: string, detalle?: string): void {
  mostrarToastConMotivo('error', titulo, detalle ?? titulo);
}

export function esMensajeReboteAsistencia(data: AsistenciaAprendizResponse): boolean {
  if ((data.segundos_restantes_salida ?? 0) > 0) {
    return true;
  }
  return esMensajeReboteTexto(data.mensaje ?? '');
}

/** Rebotes que el backend aún puede devolver como HTTP 400 (escaneos QR muy seguidos). */
export function esErrorReboteAsistenciaHTTP(mensaje: string): boolean {
  return esMensajeReboteTexto(mensaje);
}

export function mostrarToastInfoAsistencia(titulo: string, detalle?: string): void {
  mostrarToastConMotivo('info', titulo, detalle ?? titulo);
}

export function mostrarToastAvisoRegistro(titulo: string, detalle: string): void {
  const motivo = detalle.trim() || titulo.trim();
  mostrarToastConMotivo('warning', 'No se guardó el registro', motivo);
}

export async function confirmEliminarRegistroAsistencia(
  aprendizNombre: string,
  tramoLabel: string,
): Promise<boolean> {
  const result = await Swal.fire({
    title: '¿Eliminar registro de asistencia?',
    html: `<p class="text-sm">${aprendizNombre}</p><p class="text-sm font-semibold mt-1">${tramoLabel}</p><p class="text-xs mt-3 text-gray-600">Solo administradores. Esta acción no se puede deshacer.</p>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    focusCancel: true,
  });
  return result.isConfirmed;
}

export function mostrarToastResultadoDocumento(data: AsistenciaAprendizResponse): string {
  const interpretado = interpretarRespuestaRegistroAsistencia(data);
  if (interpretado.clase === 'aviso') {
    const motivo = (data.mensaje ?? '').trim() || interpretado.detalle;
    mostrarToastAvisoRegistro(interpretado.titulo, motivo);
    return motivo;
  }
  mostrarToastRegistroAsistencia(data);
  return '';
}

export function mostrarToastErrorRegistroDocumento(mensajeRaw: string, segundosRestantesSalida?: number): string {
  const interpretado = interpretarMensajeRegistroAsistencia(mensajeRaw, segundosRestantesSalida);
  const motivo = interpretado.detalle.trim() || mensajeRaw.trim();

  if (interpretado.clase === 'aviso') {
    mostrarToastAvisoRegistro(interpretado.titulo, motivo);
    return motivo;
  }

  mostrarToastConMotivo('error', 'No se guardó el registro', motivo);
  return motivo;
}
