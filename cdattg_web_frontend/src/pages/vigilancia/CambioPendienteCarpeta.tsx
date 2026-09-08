/**
 * Carpeta de un visitante en cambios pendientes: muestra su nombre o CC y,
 * al abrirla, sus cambios uno por uno. Bajo una carpeta a un solo nivel.
 * @author Cristian Deysdayr Jiménez
 */
import { ChevronDownIcon, ChevronRightIcon, UserIcon } from '@heroicons/react/24/outline';
import type { CambioPendienteGrupo } from './cambioPendienteGrupos';
import { CambioPendienteCard, type AccionCambio } from './CambioPendienteCard';

interface Props {
  grupo: CambioPendienteGrupo;
  abierta: boolean;
  onToggleAbierta: () => void;
  procesandoId: number | null;
  confirmandoAccion: { id: number; accion: AccionCambio } | null;
  onIniciarConfirmacion: (id: number, accion: AccionCambio) => void;
  onCancelarConfirmacion: () => void;
  onConfirmar: (id: number, accion: AccionCambio) => void;
}

/** Carpeta con el nombre del visitante y sus cambios adentro. */
export function CambioPendienteCarpeta({
  grupo,
  abierta,
  onToggleAbierta,
  procesandoId,
  confirmandoAccion,
  onIniciarConfirmacion,
  onCancelarConfirmacion,
  onConfirmar,
}: Props) {
  const total = grupo.cambios.length;
  const confirmandoId = confirmandoAccion?.id ?? null;

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        onClick={onToggleAbierta}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
      >
        {abierta ? (
          <ChevronDownIcon className="h-5 w-5 shrink-0 text-gray-500" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-500" />
        )}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
          <UserIcon className="h-5 w-5 text-gray-500" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-gray-900 dark:text-white">{grupo.nombre}</span>
          {grupo.documento && (
            <span className="block truncate text-xs text-gray-500">CC {grupo.documento}</span>
          )}
        </span>
        <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
          {total} {total === 1 ? 'cambio' : 'cambios'}
        </span>
      </button>

      {abierta && (
        <div className="space-y-4 border-t border-gray-200 p-4 dark:border-gray-700">
          {grupo.cambios.map((cambio) => (
            <CambioPendienteCard
              key={cambio.id}
              cambio={cambio}
              procesando={procesandoId === cambio.id}
              confirmando={confirmandoId === cambio.id}
              accionConfirmando={confirmandoAccion?.accion ?? 'aprobar'}
              onIniciarConfirmacion={(accion) => onIniciarConfirmacion(cambio.id, accion)}
              onCancelarConfirmacion={onCancelarConfirmacion}
              onConfirmar={() => onConfirmar(cambio.id, confirmandoAccion?.accion ?? 'aprobar')}
            />
          ))}
        </div>
      )}
    </section>
  );
}