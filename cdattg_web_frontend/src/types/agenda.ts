export interface InstructorAgendaEvent {
  fecha: string;
  dia_formacion_id: number;
  dia_nombre?: string;
  hora_inicio: string;
  hora_fin: string;
  ficha_id: number;
  ficha_numero: string;
  programa_nombre?: string;
  sede_nombre?: string;
  ambiente_nombre?: string;
  instructor_id?: number;
  instructor_nombre?: string;
  instructor_documento?: string;
}

export interface InstructorAgendaResponse {
  desde: string;
  hasta: string;
  eventos: InstructorAgendaEvent[];
}

export interface FichaDiaFormacionItem {
  dia_formacion_id: number;
  dia_nombre?: string;
  hora_inicio: string;
  hora_fin: string;
  orden?: number;
  jornada_id?: number | null;
  jornada_nombre?: string;
}
