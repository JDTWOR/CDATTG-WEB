export const ASIST_MODAL_IDS = {
  obsTipo: 'asistencia-modal-obs-tipo',
  obsLibre: 'asistencia-modal-obs-libre',
  obsSesionLibre: 'asistencia-modal-obs-sesion-libre',
  estado: 'asistencia-modal-estado',
  estadoMotivo: 'asistencia-modal-estado-motivo',
} as const;

export const ASIST_MODAL_IDS_ROOT = {
  estado: 'asistencia-modal-estado-root',
  estadoMotivo: 'asistencia-modal-estado-motivo-root',
} as const;

export const ASIST_REGISTRO_DOC_INPUT_ID = 'asistencia-registro-doc-manual';

export type AsistenciaMetodoRegistroId = 'documento' | 'qr' | 'individual' | 'grupal';

export type AsistenciaAccordionSectionProps = Readonly<{
  open: boolean;
  onToggle: () => void;
}>;
