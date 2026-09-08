/**
 * Tipos del submódulo de reposición de carnet por pérdida.
 *
 * @author Cristian Deysdayr Jiménez
 */

export type CarnetComprobante = {
  tipo: 'pago' | 'demanda';
  nombre: string;
};

export type CarnetPerdidaItem = {
  id: number;
  ficha_numero: string;
  programa: string;
  tipo_formacion: string;
  tipo_label: string;
  estado: 'pendiente' | 'en_espera_renovacion_digital' | 'devuelto' | string;
  estado_label: string;
  correccion_digital: boolean;
  motivo_rechazo?: string;
  comprobantes: CarnetComprobante[];
  creada_en: string;
};

export type CarnetPerdidaRevision = {
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
  correccion_digital: boolean;
  motivo_rechazo?: string;
  comprobantes: CarnetComprobante[];
};

export type CarnetPerdidaListadoResponse = {
  items: CarnetPerdidaRevision[];
  total: number;
};