/**
 * Tipos del carnet digital y de su validación.
 *
 * @author Cristian Deysdayr Jiménez
 */

export type CarnetFichaOpcion = {
  id: number;
  numero: string;
  programa: string;
  fecha_fin: string;
  regional: string;
  centro_nombre: string;
  tipo_formacion: string;
  tipo_label: string;
  estado_solicitud: string;
  accion: string;
};

export type CarnetPersonaDatos = {
  nombres: string;
  apellidos: string;
  numero_documento: string;
  tipo_documento_label: string;
  rh: string;
  tiene_foto: boolean;
};

export type CarnetDigitalResponse = {
  habilitado: boolean;
  motivo?: string;
  estado_solicitud: string;
  puede_solicitar: boolean;
  motivo_rechazo?: string;
  persona: CarnetPersonaDatos;
  fichas: CarnetFichaOpcion[];
};

export type CarnetVistaInstructor = {
  id: number;
  persona: CarnetPersonaDatos;
  ficha: CarnetFichaOpcion;
};

export type CarnetPendienteItem = {
  id: number;
  persona_id: number;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  rh: string;
  ficha_id: number;
  ficha_numero: string;
  programa: string;
  tipo_formacion: string;
  tipo_label: string;
};

export type CarnetBibliotecaFicha = {
  id: number;
  numero: string;
  programa: string;
  instructor_lider: string;
};

export type CarnetBibliotecaItem = {
  id: number;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  nombres: string;
  apellidos: string;
  numero_documento: string;
  rh: string;
  ficha_id: number;
  ficha_numero: string;
  programa: string;
  instructor_lider: string;
  tiene_foto: boolean;
  foto_url: string;
};

export type CarnetBibliotecaResponse = {
  fichas: CarnetBibliotecaFicha[];
  items: CarnetBibliotecaItem[];
};
