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
export interface JornadaItem {
  id: number;
  nombre: string;
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

// Fichas de caracterización
export interface FichaCaracterizacionRequest {
  programa_formacion_id: number;
  ficha: string;
  instructor_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  ambiente_id?: number;
  modalidad_formacion_id?: number;
  sede_id?: number;
  jornada_id?: number;
  total_horas?: number;
  status?: boolean;
  dias_formacion_ids?: number[];
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
}

export interface AsignarInstructoresRequest {
  instructor_principal_id: number;
  instructores: InstructorFichaItem[];
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
  /** Por documento/QR: "ingreso" | "salida" | "asistencia_completa" */
  tipo_registro?: string;
  mensaje?: string;
}

/** Respuesta del dashboard de asistencia (solo superadmin) */
export interface AsistenciaDashboardResponse {
  fecha: string;
  total_aprendices_en_formacion: number;
  por_ficha: AsistenciaDashboardPorFicha[];
}

export interface AsistenciaDashboardPorFicha {
  ficha_id: number;
  ficha_numero: string;
  sede_nombre: string;
  cantidad_vinieron: number;
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
