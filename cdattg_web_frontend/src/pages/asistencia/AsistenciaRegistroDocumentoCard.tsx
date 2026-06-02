import { DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  ASIST_REGISTRO_DOC_INPUT_ID,
  type AsistenciaAccordionSectionProps,
} from './asistenciaConstants';
import { AsistenciaCollapsibleCard } from './AsistenciaCollapsibleCard';
import { ModoEntradaSalidaToggle } from './ModoEntradaSalidaToggle';
import type { AccionRegistroDocumento } from './asistenciaUtils';
import type { AsistenciaPageState } from './useAsistenciaPage';

type Props = Readonly<{ page: AsistenciaPageState } & AsistenciaAccordionSectionProps>;

function textoBotonRegistro(registrando: boolean, modo: AccionRegistroDocumento): string {
  if (registrando) return 'Registrando…';
  if (modo === 'ingreso') return 'Registrar entrada';
  return 'Registrar salida';
}

function claseBotonRegistro(modo: AccionRegistroDocumento): string {
  const base =
    'min-h-[44px] shrink-0 rounded-lg px-5 text-sm font-semibold text-white disabled:opacity-50 touch-manipulation sm:mb-0';
  if (modo === 'ingreso') return `${base} bg-green-600 hover:bg-green-700`;
  return `${base} bg-red-600 hover:bg-red-700`;
}

export function AsistenciaRegistroDocumentoCard({ page, open, onToggle }: Props) {
  const etiquetaBoton = textoBotonRegistro(page.registrandoManual, page.modoRegistroDocumento);
  return (
    <AsistenciaCollapsibleCard
      open={open}
      onToggle={onToggle}
      title="Registro por documento"
      description="Digite el número de documento del aprendiz y confirme la acción."
      icon={<DocumentTextIcon className="h-6 w-6" />}
    >
      <ModoEntradaSalidaToggle modo={page.modoRegistroDocumento} onChange={page.setModoRegistroDocumento} />
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
          className={claseBotonRegistro(page.modoRegistroDocumento)}
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
