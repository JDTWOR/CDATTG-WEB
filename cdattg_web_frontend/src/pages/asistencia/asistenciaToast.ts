import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import type { AsistenciaAprendizResponse } from '../../types';

const toastBase = {
  toast: true,
  position: 'bottom-end' as const,
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
};

function etiquetaTipoRegistro(tipo?: string): string {
  if (tipo === 'ingreso') return 'Entrada';
  if (tipo === 'salida') return 'Salida';
  return 'Asistencia';
}

function nombreAprendiz(data: AsistenciaAprendizResponse): string {
  return data.aprendiz_nombre?.trim() || data.numero_documento?.trim() || 'Aprendiz';
}

export function mostrarToastRegistroAsistencia(data: AsistenciaAprendizResponse): void {
  const tipo = etiquetaTipoRegistro(data.tipo_registro);
  const nombre = nombreAprendiz(data);
  const icon = data.tipo_registro === 'salida' ? 'info' : 'success';

  Swal.fire({
    ...toastBase,
    icon,
    title: `${tipo}: ${nombre}`,
  }).catch(() => {
    /* ignorar si el toast se cierra antes de resolver */
  });
}

export function mostrarToastErrorAsistencia(mensaje: string): void {
  Swal.fire({
    ...toastBase,
    icon: 'error',
    title: mensaje,
  }).catch(() => {
    /* ignorar si el toast se cierra antes de resolver */
  });
}
