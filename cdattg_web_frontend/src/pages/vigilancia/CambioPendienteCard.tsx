/**
 * Tarjeta que revisa el vigilante: muestra el antes y el después de un cambio
 * pendiente (datos y foto) y deja aprobarlo o rechazarlo con doble confirmación.
 * Lo separé de la lista para que cada archivo tenga una sola responsabilidad.
 * @author Cristian Deysdayr Jiménez
 */
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';
import type { PersonaCambio } from './cambioPendienteAntesDespues';
import { armarCamposAntesDespues, parsearCampos } from './cambioPendienteAntesDespues';
import { FotoCambioPendiente } from './FotoCambioPendiente';

export interface CambioPendiente {
  id: number;
  persona_id: number;
  campos: string;
  estado: string;
  foto_path: string;
  created_at: string;
  persona?: PersonaCambio;
}

export type AccionCambio = 'aprobar' | 'rechazar';

interface Props {
  cambio: CambioPendiente;
  procesando: boolean;
  confirmando: boolean;
  accionConfirmando: AccionCambio;
  onIniciarConfirmacion: (accion: AccionCambio) => void;
  onCancelarConfirmacion: () => void;
  onConfirmar: () => void;
}

/** Dibuja una línea del antes y el después de un campo. */
function FilaCambio({ etiqueta, antes, despues }: { etiqueta: string; antes: string; despues: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-gray-900/40">
      <span className="w-full shrink-0 font-medium text-gray-700 dark:text-gray-300 sm:w-40">{etiqueta}</span>
      <span className="text-red-600 line-through dark:text-red-400">{antes}</span>
      <span className="text-gray-400">→</span>
      <span className="font-semibold text-green-700 dark:text-green-400">{despues}</span>
    </div>
  );
}

/** Tarjeta completa de un cambio pendiente con su comparación. */
export function CambioPendienteCard({
  cambio,
  procesando,
  confirmando,
  accionConfirmando,
  onIniciarConfirmacion,
  onCancelarConfirmacion,
  onConfirmar,
}: Props) {
  const campos = parsearCampos(cambio.campos);
  const nombre = cambio.persona
    ? `${cambio.persona.primer_nombre ?? ''} ${cambio.persona.primer_apellido ?? ''}`.trim()
    : `Persona #${cambio.persona_id}`;
  const filas = armarCamposAntesDespues(campos, cambio.persona);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{nombre}</h3>
          {cambio.persona?.numero_documento && (
            <p className="text-xs text-gray-500">Doc: {cambio.persona.numero_documento}</p>
          )}
          <p className="text-xs text-gray-400">{new Date(cambio.created_at).toLocaleString()}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          <ClockIcon className="h-3 w-3" />
          Pendiente
        </span>
      </div>

      <FotoCambioPendiente
        nombre={nombre}
        documento={cambio.persona?.numero_documento}
        tieneFotoActual={Boolean(cambio.persona?.foto_path)}
        cambioId={cambio.id}
        tieneFotoNueva={Boolean(cambio.foto_path)}
      />

      {filas.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {filas.map((f) => (
            <FilaCambio key={f.clave} etiqueta={f.etiqueta} antes={f.antes} despues={f.despues} />
          ))}
        </div>
      )}

      {confirmando ? (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 dark:border-amber-700 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            {accionConfirmando === 'aprobar'
              ? '¿Confirmar la aprobación de estos cambios?'
              : '¿Confirmar el rechazo de estos cambios?'}
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onCancelarConfirmacion}
              disabled={procesando}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={procesando}
              className={`rounded-lg px-3 py-2 text-sm text-white ${
                accionConfirmando === 'aprobar'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {procesando ? 'Procesando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onIniciarConfirmacion('rechazar')}
            disabled={procesando}
            className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <XCircleIcon className="h-4 w-4" />
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => onIniciarConfirmacion('aprobar')}
            disabled={procesando}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
          >
            <CheckCircleIcon className="h-4 w-4" />
            Aprobar
          </button>
        </div>
      )}
    </div>
  );
}