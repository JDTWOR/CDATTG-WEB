import type { Dispatch, SetStateAction } from 'react';
import type { TipoObservacionAsistenciaItem } from '../../types';

export type AsistenciaObservacionesModalState = {
  asistenciaId: number;
  aprendizId: number;
  nombre: string;
  observaciones: string;
  tipoObservacionIds: number[];
};

export type AsistenciaEstadoModalState = {
  asistenciaAprendizId: number;
  nombre: string;
  estado: string;
  motivo: string;
};

/** Campos que consume AsistenciaModals (picker y sesión). */
export type AsistenciaModalsModel = {
  observacionesModal: AsistenciaObservacionesModalState | null;
  setObservacionesModal: Dispatch<SetStateAction<AsistenciaObservacionesModalState | null>>;
  tiposObservacionCatalog: TipoObservacionAsistenciaItem[];
  observacionesGuardando: boolean;
  handleGuardarObservaciones: () => void | Promise<void>;
  observacionesSesionModal: { observaciones: string } | null;
  setObservacionesSesionModal: Dispatch<SetStateAction<{ observaciones: string } | null>>;
  observacionesSesionGuardando: boolean;
  handleGuardarObservacionesSesion: () => void | Promise<void>;
  estadoModal: AsistenciaEstadoModalState | null;
  setEstadoModal: Dispatch<SetStateAction<AsistenciaEstadoModalState | null>>;
  estadoGuardando: boolean;
  handleGuardarEstado: () => void | Promise<void>;
};
