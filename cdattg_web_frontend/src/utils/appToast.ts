/**
 * Toast genérico de la aplicación basado en SweetAlert2.
 * Lo hice para no repetir la configuración del toast en cada módulo.
 * Lo usan los módulos para avisar acciones de forma consistente.
 * @author Cristian Deysdayr Jiménez
 */
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

export type ToastAppIcon = 'success' | 'error' | 'warning' | 'info';

type ToastAppOptions = Readonly<{
  icon: ToastAppIcon;
  titulo: string;
  texto: string;
  timer?: number;
}>;

const toastAppBase = {
  toast: true,
  // Parte superior para que no tape el contenido inferior y la X de cierre.
  position: 'top-end' as const,
  showConfirmButton: false,
  // Botón X para que el usuario pueda quitar la notificación al instante.
  showCloseButton: true,
  timerProgressBar: true,
  width: '26rem',
};

/** No asumir que Swal.fire devuelve Promise (evita `.catch is not a function`). */
function lanzarToast(config: SweetAlertOptions): void {
  try {
    const resultado = Swal.fire(config);
    if (resultado && typeof (resultado as PromiseLike<unknown>).then === 'function') {
      void Promise.resolve(resultado).catch(() => {
        /* toast cerrado antes de resolver */
      });
    }
  } catch {
    /* ignorar fallo al mostrar toast */
  }
}

/**
 * Muestra un toast con el estilo de la aplicación.
 * @param opciones icono, título y texto; timer opcional en ms
 * @example mostrarToastApp({ icon: 'success', titulo: 'Listo', texto: 'Guardado' })
 */
export function mostrarToastApp(opciones: ToastAppOptions): void {
  const { icon, titulo, texto, timer = 7000 } = opciones;
  lanzarToast({
    ...toastAppBase,
    icon,
    title: titulo,
    text: texto,
    timer,
  });
}