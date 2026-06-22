export type EleccionProceso = {
  id: number;
  regional_id: number;
  regional_nombre?: string;
  anio: number;
  nombre_ciclo: string;
  estado: 'borrador' | 'inscripcion' | 'votacion' | 'empate_pendiente' | 'cerrada';
  fecha_inscripcion_inicio?: string;
  fecha_inscripcion_fin?: string;
  fecha_votacion_inicio?: string;
  fecha_votacion_fin?: string;
  min_dias_matricula?: number;
  planchas_confirmadas?: number;
  votos_registrados?: number;
  aprendices_elegibles?: number;
  created_at: string;
};

export type EleccionAprendizResumen = {
  id: number;
  nombre: string;
  ficha?: string;
  sede?: string;
};

export type EleccionPlancha = {
  id: number;
  proceso_id: number;
  estado: string;
  titular: EleccionAprendizResumen;
  suplente: EleccionAprendizResumen;
  titular_confirmado: boolean;
  suplente_confirmado: boolean;
  votos_recibidos?: number;
  motivo_rechazo?: string;
  pendiente_mi_confirmacion?: boolean;
};

export type EleccionResultado = {
  proceso_id: number;
  estado_proceso: string;
  plancha_ganadora_id?: number;
  votos_totales: number;
  participacion_pct: number;
  empate: boolean;
  nota_desempate?: string;
  conteo: { plancha_id: number; label: string; votos: number }[];
  votos?: {
    votante_nombre: string;
    votante_documento?: string;
    plancha_id: number;
    plancha_label: string;
    votado_at: string;
  }[];
};

export type RepresentanteAprendiz = {
  regional_id: number;
  regional_nombre?: string;
  proceso_id: number;
  nombre_ciclo?: string;
  anio?: number;
  titular: EleccionAprendizResumen;
  suplente: EleccionAprendizResumen;
  vigencia_desde: string;
  vigencia_hasta?: string | null;
};

export type EleccionMiRegional = {
  regional_id: number;
  regional_nombre?: string;
  proceso?: EleccionProceso;
  representantes_vigentes?: RepresentanteAprendiz;
  mi_aprendiz_id?: number;
  puede_votar: boolean;
  puede_postular: boolean;
  ya_voto?: boolean;
  es_candidato?: boolean;
  mi_voto_plancha_id?: number;
  planchas_pendientes_confirmar?: EleccionPlancha[];
};

export type EleccionProcesoRequest = {
  regional_id: number;
  anio: number;
  nombre_ciclo: string;
  fecha_inscripcion_inicio?: string | null;
  fecha_inscripcion_fin?: string | null;
  fecha_votacion_inicio?: string | null;
  fecha_votacion_fin?: string | null;
  min_dias_matricula?: number | null;
};

export type EleccionPlanchaRequest = {
  rol_candidatura: 'titular' | 'suplente';
  companero_aprendiz_id: number;
};

export type EleccionVotoRequest = {
  plancha_id: number;
};

export type EleccionDesempateRequest = {
  plancha_ganadora_id: number;
  nota_desempate: string;
};
