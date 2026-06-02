import { DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  ASIST_REGISTRO_DOC_INPUT_ID,
  type AsistenciaAccordionSectionProps,
} from './asistenciaConstants';
import { AsistenciaCollapsibleCard } from './AsistenciaCollapsibleCard';
import type { AccionRegistroDocumento } from './asistenciaUtils';
import type { AsistenciaPageState } from './useAsistenciaPage';

type Props = Readonly<{ page: AsistenciaPageState } & AsistenciaAccordionSectionProps>;

function textoBotonRegistro(registrando: boolean, accion: AccionRegistroDocumento | null): string {
  if (registrando) return 'Registrando…';
  if (accion === 'salida') return 'Registrar salida';
  if (accion === 'ingreso') return 'Registrar entrada';
  return 'Registrar asistencia';
}

function claseBotonRegistro(accion: AccionRegistroDocumento | null): string {
  const base =
    'min-h-[44px] shrink-0 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50 touch-manipulation sm:mb-0';
  if (accion === 'salida') return `${base} bg-red-600 hover:bg-red-700`;
  if (accion === 'ingreso') return `${base} bg-green-600 hover:bg-green-700`;
  return `${base} bg-primary-600 hover:bg-primary-700`;
}

function hintAccionInferida(accion: AccionRegistroDocumento | null): string {
  if (accion === 'salida') {
    return 'El aprendiz tiene entrada sin salida: se registrará la salida automáticamente.';
  }
  if (accion === 'ingreso') {
    return 'Sin entrada abierta: se registrará la entrada automáticamente.';
  }
  return 'El sistema detecta si corresponde entrada o salida según el estado del aprendiz en la ficha.';
}

export function AsistenciaRegistroDocumentoCard({ page, open, onToggle }: Props) {
  const accion = page.accionInferidaDocumento;
  const etiquetaBoton = textoBotonRegistro(page.registrandoManual, accion);

  return (
    <AsistenciaCollapsibleCard
      open={open}
      onToggle={onToggle}
      title="Registro por documento"
      description="Digite el documento del aprendiz; el sistema registra entrada o salida según corresponda."
      icon={<DocumentTextIcon className="h-6 w-6" />}
    >
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{hintAccionInferida(accion)}</p>
      <form onSubmit={page.handleRegistroManualSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={ASIST_REGISTRO_DOC_INPUT_ID} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Número de documento
          </label>
          <input
            id={ASIST_REGISTRO_DOC_INPUT_ID}
            type="text"
            inputMode="numeric"
            value={page.documentoManual}
            onChange={(e) => {
              page.setDocumentoManual(e.target.value);
              page.setErrorRegistroManual('');
              page.setMensajeRegistroManual('');
            }}
            placeholder="Ej. 1234567890"
            className="input-field w-full"
            disabled={page.registrandoManual}
          />
        </div>
        <button
          type="submit"
          disabled={page.registrandoManual || !page.documentoManual.trim()}
          className={claseBotonRegistro(accion)}
        >
          {etiquetaBoton}
        </button>
      </form>
      {page.errorRegistroManual ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{page.errorRegistroManual}</p> : null}
      {page.mensajeRegistroManual ? (
        <p className="mt-2 text-sm font-medium text-green-700 dark:text-green-400">{page.mensajeRegistroManual}</p>
      ) : null}
    </AsistenciaCollapsibleCard>
  );
}
