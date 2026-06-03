import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const swalBase = {
  showCancelButton: true,
  cancelButtonText: 'Cancelar',
  reverseButtons: true,
  focusCancel: true,
  customClass: {
    popup: 'rounded-xl',
    title: 'text-lg font-semibold',
    confirmButton: 'rounded-lg px-4 py-2 text-sm font-medium',
    cancelButton: 'rounded-lg px-4 py-2 text-sm font-medium',
  },
};

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Diálogo de confirmación para ocultar o mostrar un aprendiz en la toma de asistencia. */
export async function confirmOcultarAprendizAsistencia(
  nombreAprendiz: string,
  ocultar: boolean,
): Promise<boolean> {
  const nombre = escapeHtml(nombreAprendiz.trim() || 'Este aprendiz');

  if (ocultar) {
    const result = await Swal.fire({
      ...swalBase,
      icon: 'question',
      title: '¿Ocultar de la toma de asistencia?',
      html: `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5;color:#374151">
          <strong style="color:#111827">${nombre}</strong> no aparecerá en la lista cuando el instructor marque asistencia del día.
        </p>
        <div style="text-align:left;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.45;color:#78350f">
          <p style="margin:0 0 8px;font-weight:600">Sigue vigente en la ficha:</p>
          <ul style="margin:0;padding-left:18px">
            <li>Sigue asignado y visible en el historial</li>
            <li>Sigue contando inasistencias si no asiste</li>
            <li>No se borra el historial de asistencia previo</li>
          </ul>
        </div>
      `,
      confirmButtonText: 'Sí, ocultar',
      confirmButtonColor: '#d97706',
      width: '28rem',
    });
    return result.isConfirmed;
  }

  const result = await Swal.fire({
    ...swalBase,
    icon: 'info',
    title: '¿Mostrar en asistencia?',
    html: `
      <p style="margin:0;font-size:15px;line-height:1.5;color:#374151">
        <strong style="color:#111827">${nombre}</strong> volverá a aparecer en la toma de asistencia del día para el instructor.
      </p>
    `,
    confirmButtonText: 'Sí, mostrar',
    confirmButtonColor: '#16a34a',
    width: '26rem',
  });
  return result.isConfirmed;
}
