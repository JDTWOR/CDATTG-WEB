import type { FichaDiaFormacionItem } from './agenda';

export type { FichaDiaFormacionItem } from './agenda';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  password_actual: string;
  password_nueva: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  user: UserResponse;
  roles: string[];
  permissions: string[];
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  status: boolean;
  persona_id?: number;
}

export interface PersonaRequest {
  tipo_documento?: number;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  genero?: number;
  telefono?: string;
  celular?: string;
  email?: string;
  pais_id?: number;
  departamento_id?: number;
  municipio_id?: number;
  direccion?: string;
  status?: boolean;
  parametro_id?: number;
  nivel_escolaridad_id?: number;
}

/** Actualización de perfil propio (sin número de documento ni estado). */
export interface PersonaSelfUpdateRequest {
  tipo_documento?: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  fecha_nacimiento?: string;
  genero?: number;
  telefono?: string;
  celular?: string;
  email?: string;
  pais_id?: number;
  departamento_id?: number;
  municipio_id?: number;
  direccion?: string;
  parametro_id?: number;
  nivel_escolaridad_id?: number;
}

export interface PersonaResponse {
  id: number;
  tipo_documento?: number;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  full_name: string;
  fecha_nacimiento?: string;
  genero?: number;
  telefono?: string;
  celular?: string;
  email?: string;
  pais_id?: number;
  departamento_id?: number;
  municipio_id?: number;
  direccion?: string;
  status: boolean;
  parametro_id?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface PersonaImportResult {
  processed_count: number;
  duplicates_count: number;
  error_count: number;
  status: string;
}

export interface PersonaImportLogItem {
  id: number;
  filename: string;
  processed_count: number;
  duplicates_count: number;
  error_count: number;
  status: string;
  usuario_nombre: string;
  created_at: string;
}

/** Progreso en tiempo real durante la importación por streaming */
export interface PersonaImportProgress {
  total: number;
  current: number;
  processed: number;
  duplicates: number;
  errors: number;
  type?: 'progress' | 'done' | 'error' | 'result';
}

// Resultado de importación masiva de instructores desde Excel
export interface InstructorImportResult {
  processed_count: number;
  duplicates_count: number;
  error_count: number;
  status: string;
}

// Ítem del historial de importaciones de instructores
export interface InstructorImportLogItem {
  id: number;
  filename: string;
  processed_count: number;
  duplicates_count: number;
  error_count: number;
  status: string;
  usuario_nombre: string;
  created_at: string;
}

// Resultado de importación de programas desde Excel catálogo
export interface ProgramaImportResult {
  processed_count: number;
  duplicates_count: number;
  error_count: number;
  redes_created: number;
  status: string;
}

// Resultado de importación de fichas (reporte aprendices Excel)
export interface FichaImportResult {
  processed_count: number;
  updated_count: number;
  created_count: number;
  duplicates_count: number;
  error_count: number;
  ficha_created: boolean;
  status: string;
  incident_report_base64?: string;
}

// Programas de formación
export interface ProgramaFormacionRequest {
  codigo: string;
  nombre: string;
  red_conocimiento_id?: number;
  nivel_formacion_id?: number;
  tipo_programa_id?: number;
  status?: boolean;
  horas_totales?: number;
  horas_etapa_lectiva?: number;
  horas_etapa_productiva?: number;
}

export interface ProgramaFormacionResponse {
  id: number;
  codigo: string;
  nombre: string;
  red_conocimiento_id?: number;
  red_conocimiento_nombre?: string;
  nivel_formacion_id?: number;
  tipo_programa_id?: number;
  status: boolean;
  horas_totales?: number;
  horas_etapa_lectiva?: number;
  horas_etapa_productiva?: number;
  cantidad_fichas?: number;
}

// Catalogos (para formularios)
export interface SedeItem {
  id: number;
  nombre: string;
  regional_id?: number;
}
export interface AmbienteItem {
  id: number;
  nombre: string;
}
export interface ModalidadFormacionItem {
  id: number;
  nombre: string;
  codigo?: string;
}
export interface JornadaBloqueItem {
  id?: number;
  dia_formacion_id: number;
  dia_nombre?: string;
  hora_inicio: string;
  hora_fin: string;
  orden?: number;
}

export interface JornadaAdminItem {
  id: number;
  nombre: string;
  minutos_extension_fin: number;
  bloques: JornadaBloqueItem[];
}

export interface JornadaPropagateResult {
  actualizadas: number;
  omitidas: number;
  detalles?: { ficha_id: number; ficha?: string; motivo: string }[];
}

export interface JornadaUpdateResponse extends JornadaAdminItem {
  propagacion?: JornadaPropagateResult;
}

export interface DiaSinFormacionSedeItem {
  id: number;
  sede_id: number;
  sede_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  created_at?: string;
}

export interface ConfiguracionAsistenciaItem {
  plazo_edicion_observaciones_dias: number;
  intervalo_auto_cierre_minutos: number;
  minutos_alerta_sin_sesion: number;
  minutos_extension_default: number;
}

export interface JornadaItem {
  id: number;
  nombre: string;
  hora_inicio?: string;
  hora_fin?: string;
  minutos_extension_fin?: number;
  bloques?: JornadaBloqueItem[];
}
export interface DiaFormacionItem {
  id: number;
  nombre: string;
  codigo?: string;
}

export interface PaisItem {
  id: number;
  nombre: string;
}
export interface DepartamentoItem {
  id: number;
  nombre: string;
}
export interface MunicipioItem {
  id: number;
  nombre: string;
}
export interface ParametroItem {
  id: number;
  name: string;
}
export interface RegionalItem {
  id: number;
  nombre: string;
}

// Infraestructura - Sede
export interface SedeCreateRequest {
  nombre: string;
  direccion: string;
  regional_id: number;
}

export interface SedeUpdateRequest {
  nombre: string;
  direccion: string;
  regional_id: number;
  status?: boolean;
}

export interface SedeResponse {
  id: number;
  nombre: string;
  direccion: string;
  regional_id: number;
  status: boolean;
}

export interface SedeListItem {
  id: number;
  nombre: string;
  direccion: string;
  regional_id: number;
  regional_nombre: string;
  status: boolean;
}

// Ambientes (infraestructura)
export interface AmbienteCreateRequest {
  nombre: string;
  piso_id: number;
}

export interface AmbienteUpdateRequest {
  nombre: string;
  piso_id: number;
  status?: boolean;
}

export interface AmbienteResponse {
  id: number;
  nombre: string;
  piso_id: number;
  status: boolean;
}

export interface AmbienteListItem {
  id: number;
  nombre: string;
  piso_id: number;
  piso_nombre: string;
  bloque_nombre: string;
  sede_nombre: string;
  status: boolean;
}

// Piso (infraestructura)
export interface PisoCreateRequest {
  nombre: string;
  bloque_id: number;
}

export interface PisoUpdateRequest {
  nombre: string;
  bloque_id: number;
}

export interface PisoResponse {
  id: number;
  nombre: string;
  bloque_id: number;
}

// Lookups infraestructura
export interface BloqueInfraestructuraItem {
  id: number;
  nombre: string;
  sede_id: number;
  sede_nombre: string;
}

export interface PisoInfraestructuraItem {
  id: number;
  nombre: string;
  bloque_id: number;
  bloque_nombre: string;
  sede_nombre: string;
}

export interface BloqueCreateRequest {
  nombre: string;
  sede_id: number;
}

export interface BloqueUpdateRequest {
  nombre: string;
  sede_id: number;
}

export interface BloqueResponse {
  id: number;
  nombre: string;
  sede_id: number;
}

// Fichas de caracterización
export interface FichaCaracterizacionRequest {
  programa_formacion_id: number;
  ficha: string;
  instructor_id?: number | null;
  fecha_inicio?: string;
  fecha_fin?: string;
  ambiente_id?: number | null;
  modalidad_formacion_id?: number | null;
  sede_id?: number | null;
  jornada_id?: number | null;
  total_horas?: number;
  status?: boolean;
  dias_formacion_ids?: number[];
  dias_formacion_nombres?: string[];
  dias_formacion?: FichaDiaFormacionItem[];
  horarios?: FichaDiaFormacionItem[];
  hora_inicio?: string;
  hora_fin?: string;
}

export interface FichaCaracterizacionResponse {
  id: number;
  programa_formacion_id: number;
  programa_formacion_nombre?: string;
  ficha: string;
  instructor_id?: number;
  instructor_nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  ambiente_id?: number;
  ambiente_nombre?: string;
  sede_id?: number;
  sede_nombre?: string;
  modalidad_formacion_id?: number;
  modalidad_formacion_nombre?: string;
  jornada_id?: number;
  jornada_nombre?: string;
  total_horas?: number;
  status: boolean;
  dias_formacion_ids?: number[];
  dias_formacion_nombres?: string[];
  dias_formacion?: FichaDiaFormacionItem[];
  horarios?: FichaDiaFormacionItem[];
  cantidad_aprendices: number;
}

// Instructor (item para selects y listados)
export interface InstructorItem {
  id: number;
  nombre: string;
  numero_documento?: string;
  regional_id?: number | null;
  regional_nombre?: string;
  estado?: boolean;
}

// Asignación instructor a ficha
export interface InstructorFichaItem {
  instructor_id: number;
  competencia_id?: number;
  fecha_inicio: string;
  fecha_fin: string;
  total_horas_instructor?: number;
  dias_formacion_ids?: number[];
}

export interface AsignarInstructoresRequest {
  instructor_lider_id: number;
  instructores: InstructorFichaItem[];
}

export interface TrasladoParFechaRequest {
  fecha_origen: string;
  fecha_destino: string;
}

export interface TrasladarDiaInstructorRequest {
  modo: 'permanente' | 'fechas';
  instructor_origen_id: number;
  dia_origen_id: number;
  instructor_destino_id: number;
  dia_destino_id: number;
  motivo: string;
  pares_fechas?: TrasladoParFechaRequest[];
}

export interface InstructorFichaResponse {
  id: number;
  instructor_id: number;
  instructor_nombre: string;
  ficha_id: number;
  competencia_id?: number;
  competencia_nombre?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  total_horas_instructor?: number;
  dias_formacion_ids?: number[];
  dias_formacion_nombres?: string[];
}

// Aprendices
export interface AprendizRequest {
  persona_id: number;
  ficha_caracterizacion_id: number;
  estado?: boolean;
}

export interface AprendizResponse {
  id: number;
  persona_id: number;
  persona_nombre: string;
  persona_documento?: string;
  ficha_caracterizacion_id: number;
  ficha_numero?: string;
  programa_nombre?: string;
  regional_nombre?: string;
  estado: boolean;
  oculto_en_asistencia?: boolean;
}

export interface AsignarAprendicesRequest {
  personas: number[];
}

// Crear instructor desde persona
export interface CreateInstructorRequest {
  persona_id: number;
  regional_id?: number;
}

// Actualizar instructor (regional, estado)
export interface UpdateInstructorRequest {
  regional_id?: number;
  estado?: boolean;
}

// Asistencia
export interface AsistenciaReglasResponse {
  relaxar_restriccion_asistencia: boolean;
}

export interface AsistenciaRequest {
  instructor_ficha_id: number;
  fecha: string; // YYYY-MM-DD
  hora_inicio?: string;
}

export interface AsistenciaResponse {
  id: number;
  instructor_ficha_id: number;
  ficha_id?: number;
  ficha_numero?: string;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  is_finished: boolean;
  observaciones?: string;
  cantidad_aprendices?: number;
}

export interface AsistenciaAprendizRequest {
  asistencia_id: number;
  aprendiz_id: number;
}

export interface AsistenciaAprendizResponse {
  id: number;
  asistencia_id: number;
  aprendiz_id: number;
  aprendiz_nombre?: string;
  numero_documento?: string;
  hora_ingreso?: string;
  hora_salida?: string;
  observaciones?: string;
   ficha_id?: number;
   ficha_numero?: string;
  /** Estado de la asistencia en la sesión (backend):
   *  "" | "ASISTENCIA_COMPLETA" | "ASISTENCIA_PARCIAL" | "ABANDONO_JORNADA" | "REGISTRO_POR_CORREGIR"
   */
  estado?: string;
  requiere_revision?: boolean;
  motivo_ajuste?: string;
  /** Por documento/QR: "ingreso" | "salida" | "asistencia_completa" */
  tipo_registro?: string;
  mensaje?: string;
  /** Segundos restantes antes de poder marcar salida (rebote QR/documento). */
  segundos_restantes_salida?: number;
  /** Tipos de observación predefinidos asociados (varios por registro) */
  tipos_observacion?: TipoObservacionAsistenciaItem[];
}

export interface TipoObservacionAsistenciaItem {
  id: number;
  codigo: string;
  nombre: string;
}

export interface TipoObservacionAsistenciaCreateRequest {
  codigo: string;
  nombre: string;
  activo?: boolean;
}

/** Respuesta del dashboard de asistencia (solo superadmin) */
export interface AsistenciaDashboardFichaSinSesion {
  ficha_id: number;
  ficha_numero: string;
  programa_nombre?: string;
  jornada_nombre?: string;
  sede_nombre?: string;
  instructor_nombre?: string;
  instructor_id?: number;
  total_aprendices: number;
}

export interface AsistenciaDashboardResponse {
  fecha: string;
  total_aprendices_en_formacion: number;
  /** Aprendices activos en fichas con formación hoy y jornada activa (o todas las jornadas si fecha histórica) */
  total_aprendices_esperados?: number;
  /** Nombres de jornada considerados en el esperado (ej. MAÑANA, JORNADA CONTINUA) */
  jornadas_activas?: string[];
  /** Todas las jornadas con formación en la fecha (opciones del filtro) */
  jornadas_disponibles?: string[];
  /** Fichas sin sesión solo en jornada activa (métrica de card) */
  fichas_sin_sesion_jornada_activa?: number;
  pendientes_revision?: number;
  por_ficha: AsistenciaDashboardPorFicha[];
  /** Fichas esperadas hoy (día formación + jornada activa) sin sesión de asistencia */
  fichas_sin_asistencia_hoy?: AsistenciaDashboardFichaSinSesion[];
  total_fichas_registradas?: number;
  fichas_con_sesion_hoy?: number;
}

/** Resumen KPI del panel principal /dashboard */
export interface DashboardResumenResponse {
  fecha: string;
  institucion: {
    total_regionales: number;
    total_sedes: number;
    total_fichas_activas: number;
    total_instructores: number;
    total_aprendices: number;
  };
  asistencia_hoy: {
    en_formacion_ahora: number;
    esperados: number;
    pendientes_revision: number;
    fichas_con_sesion: number;
    fichas_sin_sesion: number;
    pct_cobertura: number;
    total_fichas_registradas: number;
  };
  por_sede: Array<{
    nombre: string;
    regional_nombre: string;
    vinieron: number;
    total: number;
    pct: number;
  }>;
  por_jornada: Array<{
    nombre: string;
    vinieron: number;
    total: number;
    pct: number;
  }>;
  por_regional: Array<{
    nombre: string;
    vinieron: number;
    total: number;
    fichas_sin_sesion: number;
  }>;
  fichas_sin_sesion: AsistenciaDashboardFichaSinSesion[];
  riesgo: {
    casos_bienestar: number;
    pendientes_revision: number;
  };
  alcance: {
    restricted: boolean;
    empty: boolean;
    regional_ids: number[];
    regional_nombres: string[];
  };
  jornadas_activas?: string[];
  jornadas_disponibles?: string[];
  por_ficha: AsistenciaDashboardPorFicha[];
  ultimos_dias_formacion?: Array<{
    fecha: string;
    etiqueta: string;
    esperados: number;
    vinieron: number;
    pct: number;
  }>;
}

export interface UsuarioRegionalesResponse {
  user_id: number;
  regional_ids: number[];
  regionales: RegionalItem[];
}

/** Casos de bienestar: aprendices con N+ inasistencias (riesgo deserción) */
export interface CasosBienestarResponse {
  dias_analizados: number;
  min_fallas: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  historico_completo?: boolean;
  casos: CasoBienestarItem[];
}

export interface InasistenciaDetalleItem {
  fecha: string;
  instructor_nombre?: string;
  observaciones?: string;
}

export interface CasoBienestarAprendizDetalleResponse {
  ficha_numero: string;
  aprendiz_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  inasistencias: InasistenciaDetalleItem[];
  inasistencias_justificadas?: InasistenciaDetalleItem[];
}

export interface MisInasistenciasResponse {
  aprendiz_id: number;
  ficha_numero: string;
  programa_nombre?: string;
  sede_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  /** Inasistencias sin justificar */
  total_inasistencias: number;
  total_inasistencias_justificadas?: number;
  inasistencias: InasistenciaDetalleItem[];
  inasistencias_justificadas?: InasistenciaDetalleItem[];
}

export interface SesionSinAsistenciaTomadaItem {
  asistencia_id: number;
  ficha_numero: string;
  instructor_id: number;
  instructor_nombre: string;
  numero_documento: string;
  programa_nombre: string;
  sede_nombre: string;
  jornada_nombre: string;
  fecha: string;
  sesion_finalizada: boolean;
  tipo_incumplimiento: 'sesion_sin_marcas' | 'dia_sin_sesion';
}

export interface SesionesSinAsistenciaTomadaResponse {
  dias_analizados: number;
  fecha_inicio: string;
  fecha_fin: string;
  historico_completo?: boolean;
  total: number;
  sesiones: SesionSinAsistenciaTomadaItem[];
}

export interface CasoBienestarItem {
  aprendiz_id: number;
  persona_nombre: string;
  numero_documento: string;
  ficha_numero: string;
  programa_nombre?: string;
  sede_nombre: string;
  jornada_nombre?: string;
  instructor_nombre?: string;
  ambiente_nombre?: string;
  modalidad_formacion_nombre?: string;
  total_sesiones: number;
  asistencias_efectivas: number;
  /** Inasistencias sin justificar (umbral de alerta) */
  inasistencias: number;
  inasistencias_justificadas?: number;
}

export interface AsistenciaDashboardPorFicha {
  ficha_id: number;
  ficha_numero: string;
  programa_nombre: string;
  sede_nombre: string;
  jornada_nombre?: string;
  cantidad_vinieron: number;
  /** Aprendices con ingreso y sin salida registrada (en formación ahora) */
  cantidad_en_formacion?: number;
  total_aprendices?: number;
}

// --- Inventario (documentacion_inventario.md) ---
export interface InventarioDashboardResponse {
  total_productos: number;
  stock_bajo: number;
  stock_critico: number;
  ordenes_en_espera: number;
  ordenes_hoy: number;
}

export interface ProductoResponse {
  id: number;
  name: string;
  tipo_producto_id?: number;
  descripcion: string;
  peso?: number;
  unidad_medida_id?: number;
  cantidad: number;
  codigo_barras?: string;
  estado_producto_id?: number;
  categoria_id?: number;
  marca_id?: number;
  contrato_convenio_id?: number;
  ambiente_id?: number;
  proveedor_id?: number;
  imagen?: string;
  nivel_stock?: string;
}

export interface ProductoCreateRequest {
  name: string;
  tipo_producto_id: number;
  descripcion: string;
  peso?: number;
  unidad_medida_id: number;
  cantidad: number;
  codigo_barras?: string;
  estado_producto_id: number;
  categoria_id: number;
  marca_id: number;
  contrato_convenio_id: number;
  ambiente_id: number;
  proveedor_id: number;
  fecha_vencimiento?: string;
}

export interface ProductoUpdateRequest extends Omit<ProductoCreateRequest, 'cantidad' | 'proveedor_id'> {
  cantidad?: number;
  proveedor_id?: number;
}

export interface CarritoItem {
  producto_id: number;
  cantidad: number;
}

export interface OrdenFromCarritoRequest {
  tipo: 'prestamo' | 'salida';
  descripcion: string;
  fecha_devolucion?: string;
  carrito: CarritoItem[];
  rol_id?: number;
  programa_formacion_id?: number;
}

export interface DetalleOrdenResponse {
  id: number;
  orden_id: number;
  producto_id: number;
  producto_nombre?: string;
  cantidad: number;
  cantidad_devuelta: number;
  pendiente_devolver: number;
  estado: string;
  cierra_sin_stock: boolean;
}

export interface OrdenResponse {
  id: number;
  numero_orden: string;
  tipo_orden: string;
  descripcion: string;
  fecha_orden: string;
  fecha_devolucion?: string;
  estado: string;
  persona_id: number;
  persona_nombre?: string;
  detalle_ordenes: DetalleOrdenResponse[];
  created_at: string;
}

export interface AprobarRechazarRequest {
  orden_id: number;
  detalle_orden_id?: number;
  aprobar: boolean;
  observaciones?: string;
}

export interface DevolucionCreateRequest {
  detalle_orden_id: number;
  cantidad_devuelta: number;
  cierra_sin_stock?: boolean;
  observaciones?: string;
}

export interface DevolucionResponse {
  id: number;
  detalle_orden_id: number;
  cantidad_devuelta: number;
  cierra_sin_stock: boolean;
  fecha_devolucion: string;
  observaciones?: string;
}

export interface ProveedorResponse {
  id: number;
  name: string;
  nit: string;
  status: boolean;
}

export interface CategoriaResponse {
  id: number;
  name: string;
  status: boolean;
}

export interface MarcaResponse {
  id: number;
  name: string;
  status: boolean;
}

export interface ContratoConvenioResponse {
  id: number;
  numero_contrato: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  status: boolean;
}

// --- Permisos / Usuarios (API Go + Casbin) ---
export interface UsuarioListItem {
  id: number;
  email: string;
  full_name: string;
  numero_documento: string;
  status: boolean;
  roles: string[];
}

export interface PermisoPair {
  obj: string;
  act: string;
}

export interface UsuarioPermisosResponse {
  user_id: number;
  email?: string;
  full_name?: string;
  numero_documento?: string;
  status?: boolean;
  roles: string[];
  permisos: string[];
  directos: PermisoPair[]; // permisos asignados directamente (p2)
}

export interface DefinicionesPermisosResponse {
  roles: string[];
  permisos: PermisoPair[];
}
