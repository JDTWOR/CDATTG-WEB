import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config/api';
import type {
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  UserResponse,
  PersonaRequest,
  PersonaResponse,
  PaginatedResponse,
  PersonaImportResult,
  PersonaImportLogItem,
  PersonaImportProgress,
  InstructorImportResult,
  InstructorImportLogItem,
  ProgramaFormacionRequest,
  ProgramaFormacionResponse,
  ProgramaImportResult,
  FichaImportResult,
  FichaCaracterizacionRequest,
  FichaCaracterizacionResponse,
  InstructorItem,
  AsignarInstructoresRequest,
  InstructorFichaResponse,
  AprendizRequest,
  AprendizResponse,
  CreateInstructorRequest,
  UpdateInstructorRequest,
  AsistenciaRequest,
  AsistenciaResponse,
  AsistenciaAprendizRequest,
  AsistenciaAprendizResponse,
  AsistenciaDashboardResponse,
  SedeItem,
  AmbienteItem,
  ModalidadFormacionItem,
  JornadaItem,
  DiaFormacionItem,
  PaisItem,
  DepartamentoItem,
  MunicipioItem,
  ParametroItem,
  RegionalItem,
  InventarioDashboardResponse,
  ProductoResponse,
  ProductoCreateRequest,
  ProductoUpdateRequest,
  OrdenResponse,
  OrdenFromCarritoRequest,
  AprobarRechazarRequest,
  DevolucionCreateRequest,
  DevolucionResponse,
  ProveedorResponse,
  CategoriaResponse,
  MarcaResponse,
  ContratoConvenioResponse,
  UsuarioListItem,
  UsuarioPermisosResponse,
  DefinicionesPermisosResponse,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para agregar token a las peticiones
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  async getCurrentUser(): Promise<UserResponse> {
    const response = await this.api.get<UserResponse>('/auth/me');
    return response.data;
  }

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await this.api.post<{ message: string }>('/auth/change-password', data);
    return response.data;
  }

  // Personas endpoints
  async getPersonas(page: number = 1, pageSize: number = 20, search: string = ''): Promise<PaginatedResponse<PersonaResponse>> {
    const response = await this.api.get<PaginatedResponse<PersonaResponse>>('/personas', {
      params: { page, page_size: pageSize, search: search || undefined },
    });
    return response.data;
  }

  async getPersonaById(id: number): Promise<PersonaResponse> {
    const response = await this.api.get<PersonaResponse>(`/personas/${id}`);
    return response.data;
  }

  async createPersona(data: PersonaRequest): Promise<PersonaResponse> {
    const response = await this.api.post<PersonaResponse>('/personas', data);
    return response.data;
  }

  async updatePersona(id: number, data: PersonaRequest): Promise<PersonaResponse> {
    const response = await this.api.put<PersonaResponse>(`/personas/${id}`, data);
    return response.data;
  }

  async deletePersona(id: number): Promise<void> {
    await this.api.delete(`/personas/${id}`);
  }

  async resetPersonaPassword(id: number): Promise<void> {
    await this.api.post(`/personas/${id}/reset-password`);
  }

  async uploadPersonasImport(file: File): Promise<PersonaImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post<PersonaImportResult>('/personas/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  /**
   * Importa personas con progreso en tiempo real (streaming).
   * Llama a onProgress con cada actualización y devuelve el resultado final.
   */
  async uploadPersonasImportWithProgress(
    file: File,
    onProgress: (p: PersonaImportProgress) => void
  ): Promise<PersonaImportResult> {
    const token = localStorage.getItem('token');
    const baseURL = this.api.defaults.baseURL || '';
    const url = `${baseURL}/personas/import`;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Stream-Progress': 'true',
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || res.statusText);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error('No se pudo leer la respuesta');
    const dec = new TextDecoder();
    let buffer = '';
    let finalResult: PersonaImportResult | null = null;
    let streamError: string | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += dec.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const data = JSON.parse(trimmed) as PersonaImportProgress & { error?: string; processed_count?: number; duplicates_count?: number; error_count?: number; status?: string };
          if (data.type === 'error' && data.error) {
            streamError = data.error;
            break;
          }
          if (data.total !== undefined) onProgress(data as PersonaImportProgress);
          if (data.type === 'done' || data.type === 'result') {
            finalResult = {
              processed_count: data.processed_count ?? data.processed,
              duplicates_count: data.duplicates_count ?? data.duplicates,
              error_count: data.error_count ?? data.errors,
              status: data.status ?? 'completado',
            };
          }
        } catch {
          // Ignorar líneas que no sean JSON válido (fragmentos de chunk)
        }
      }
      if (streamError) break;
    }
    if (streamError) throw new Error(streamError);
    if (!finalResult) throw new Error('Importación sin resultado');
    return finalResult;
  }

  async getPersonaImports(limit: number = 50): Promise<PersonaImportLogItem[]> {
    const response = await this.api.get<{ data: PersonaImportLogItem[] }>('/personas/imports', {
      params: { limit },
    });
    return response.data.data;
  }

  async downloadPersonaImportTemplate(): Promise<Blob> {
    const response = await this.api.get<Blob>('/personas/import/template', {
      responseType: 'blob',
    });
    return response.data;
  }

  // Programas de formación
  async getProgramasFormacion(page = 1, pageSize = 20, search = ''): Promise<PaginatedResponse<ProgramaFormacionResponse>> {
    const response = await this.api.get<PaginatedResponse<ProgramaFormacionResponse>>('/programas-formacion', {
      params: { page, page_size: pageSize, search: search || undefined },
    });
    return response.data;
  }

  async getProgramaFormacionById(id: number): Promise<ProgramaFormacionResponse> {
    const response = await this.api.get<ProgramaFormacionResponse>(`/programas-formacion/${id}`);
    return response.data;
  }

  async createProgramaFormacion(data: ProgramaFormacionRequest): Promise<ProgramaFormacionResponse> {
    const response = await this.api.post<ProgramaFormacionResponse>('/programas-formacion', data);
    return response.data;
  }

  async updateProgramaFormacion(id: number, data: ProgramaFormacionRequest): Promise<ProgramaFormacionResponse> {
    const response = await this.api.put<ProgramaFormacionResponse>(`/programas-formacion/${id}`, data);
    return response.data;
  }

  async deleteProgramaFormacion(id: number): Promise<void> {
    await this.api.delete(`/programas-formacion/${id}`);
  }

  async uploadProgramasImport(file: File): Promise<ProgramaImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post<ProgramaImportResult>('/programas-formacion/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Catalogos (para formulario de ficha)
  async getCatalogosSedes(): Promise<SedeItem[]> {
    const response = await this.api.get<{ data: SedeItem[] }>('/catalogos/sedes');
    return response.data.data;
  }
  async getCatalogosAmbientes(): Promise<AmbienteItem[]> {
    const response = await this.api.get<{ data: AmbienteItem[] }>('/catalogos/ambientes');
    return response.data.data;
  }
  async getCatalogosModalidadesFormacion(): Promise<ModalidadFormacionItem[]> {
    const response = await this.api.get<{ data: ModalidadFormacionItem[] }>('/catalogos/modalidades-formacion');
    return response.data.data;
  }
  async getCatalogosJornadas(): Promise<JornadaItem[]> {
    const response = await this.api.get<{ data: JornadaItem[] }>('/catalogos/jornadas');
    return response.data.data;
  }
  async getCatalogosDiasFormacion(): Promise<DiaFormacionItem[]> {
    const response = await this.api.get<{ data: DiaFormacionItem[] }>('/catalogos/dias-formacion');
    return response.data.data;
  }

  async getCatalogosPaises(): Promise<PaisItem[]> {
    const response = await this.api.get<{ data: PaisItem[] }>('/catalogos/paises');
    return response.data.data;
  }
  async getCatalogosDepartamentos(paisId: number): Promise<DepartamentoItem[]> {
    const response = await this.api.get<{ data: DepartamentoItem[] }>('/catalogos/departamentos', { params: { pais_id: paisId } });
    return response.data.data;
  }
  async getCatalogosMunicipios(departamentoId: number): Promise<MunicipioItem[]> {
    const response = await this.api.get<{ data: MunicipioItem[] }>('/catalogos/municipios', { params: { departamento_id: departamentoId } });
    return response.data.data;
  }
  async getCatalogosTiposDocumento(): Promise<ParametroItem[]> {
    const response = await this.api.get<{ data: ParametroItem[] }>('/catalogos/tipos-documento');
    return response.data.data;
  }
  async getCatalogosGeneros(): Promise<ParametroItem[]> {
    const response = await this.api.get<{ data: ParametroItem[] }>('/catalogos/generos');
    return response.data.data;
  }
  async getCatalogosPersonaCaracterizacion(): Promise<ParametroItem[]> {
    const response = await this.api.get<{ data: ParametroItem[] }>('/catalogos/persona-caracterizacion');
    return response.data.data;
  }
  async getCatalogosRegionales(): Promise<RegionalItem[]> {
    const response = await this.api.get<{ data: RegionalItem[] }>('/catalogos/regionales');
    return response.data.data;
  }

  // Fichas de caracterización
  async getFichasCaracterizacion(
    page = 1,
    pageSize = 20,
    programaId?: number,
    misFichas?: boolean
  ): Promise<PaginatedResponse<FichaCaracterizacionResponse>> {
    const response = await this.api.get<PaginatedResponse<FichaCaracterizacionResponse>>('/fichas-caracterizacion', {
      params: { page, page_size: pageSize, programa_id: programaId, mis_fichas: misFichas ? '1' : undefined },
    });
    return response.data;
  }

  async getFichaCaracterizacionById(id: number): Promise<FichaCaracterizacionResponse> {
    const response = await this.api.get<FichaCaracterizacionResponse>(`/fichas-caracterizacion/${id}`);
    return response.data;
  }

  async createFichaCaracterizacion(data: FichaCaracterizacionRequest): Promise<FichaCaracterizacionResponse> {
    const response = await this.api.post<FichaCaracterizacionResponse>('/fichas-caracterizacion', data);
    return response.data;
  }

  async updateFichaCaracterizacion(id: number, data: FichaCaracterizacionRequest): Promise<FichaCaracterizacionResponse> {
    const response = await this.api.put<FichaCaracterizacionResponse>(`/fichas-caracterizacion/${id}`, data);
    return response.data;
  }

  async deleteFichaCaracterizacion(id: number): Promise<void> {
    await this.api.delete(`/fichas-caracterizacion/${id}`);
  }

  async uploadFichasImport(file: File): Promise<FichaImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post<FichaImportResult>('/fichas-caracterizacion/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Instructores de una ficha
  async getFichaInstructores(fichaId: number): Promise<InstructorFichaResponse[]> {
    const response = await this.api.get<{ data: InstructorFichaResponse[] }>(`/fichas-caracterizacion/${fichaId}/instructores`);
    return response.data.data;
  }

  async asignarInstructores(fichaId: number, data: AsignarInstructoresRequest): Promise<void> {
    await this.api.post(`/fichas-caracterizacion/${fichaId}/instructores`, data);
  }

  async desasignarInstructor(fichaId: number, instructorId: number): Promise<void> {
    await this.api.delete(`/fichas-caracterizacion/${fichaId}/instructores/${instructorId}`);
  }

  // Aprendices de una ficha
  async getFichaAprendices(fichaId: number): Promise<AprendizResponse[]> {
    const response = await this.api.get<{ data: AprendizResponse[] }>(`/fichas-caracterizacion/${fichaId}/aprendices`);
    return response.data.data;
  }

  async asignarAprendices(fichaId: number, personas: number[]): Promise<void> {
    await this.api.post(`/fichas-caracterizacion/${fichaId}/aprendices`, { personas });
  }

  async desasignarAprendices(fichaId: number, personas: number[]): Promise<void> {
    await this.api.post(`/fichas-caracterizacion/${fichaId}/aprendices/desasignar`, { personas });
  }

  // Instructores
  async getInstructores(): Promise<InstructorItem[]> {
    const response = await this.api.get<{ data: InstructorItem[] }>('/instructores');
    return response.data.data;
  }

  async getInstructorById(id: number): Promise<InstructorItem> {
    const response = await this.api.get<InstructorItem>(`/instructores/${id}`);
    return response.data;
  }

  async updateInstructor(id: number, data: UpdateInstructorRequest): Promise<InstructorItem> {
    const response = await this.api.put<InstructorItem>(`/instructores/${id}`, data);
    return response.data;
  }

  async deleteInstructor(id: number): Promise<void> {
    await this.api.delete(`/instructores/${id}`);
  }

  // Aprendices (CRUD global)
  async getAprendices(page = 1, pageSize = 20, fichaId?: number, search?: string): Promise<PaginatedResponse<AprendizResponse>> {
    const response = await this.api.get<PaginatedResponse<AprendizResponse>>('/aprendices', {
      params: { page, page_size: pageSize, ficha_id: fichaId, search: search || undefined },
    });
    return response.data;
  }

  async getAprendizById(id: number): Promise<AprendizResponse> {
    const response = await this.api.get<AprendizResponse>(`/aprendices/${id}`);
    return response.data;
  }

  async createAprendiz(data: AprendizRequest): Promise<AprendizResponse> {
    const response = await this.api.post<AprendizResponse>('/aprendices', data);
    return response.data;
  }

  async updateAprendiz(id: number, data: AprendizRequest): Promise<AprendizResponse> {
    const response = await this.api.put<AprendizResponse>(`/aprendices/${id}`, data);
    return response.data;
  }

  async deleteAprendiz(id: number): Promise<void> {
    await this.api.delete(`/aprendices/${id}`);
  }

  // Crear instructor desde persona
  async createInstructorFromPersona(data: CreateInstructorRequest): Promise<{ id: number; nombre: string }> {
    const response = await this.api.post<{ id: number; nombre: string }>('/instructores', data);
    return response.data;
  }

  /** Importación masiva de instructores desde Excel. Opcional: regional_id para asignar regional por defecto. */
  async uploadInstructoresImport(file: File, regionalId?: number): Promise<InstructorImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post<InstructorImportResult>('/instructores/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: regionalId != null && regionalId > 0 ? { regional_id: regionalId } : undefined,
    });
    return response.data;
  }

  async getInstructorImports(limit: number = 50): Promise<InstructorImportLogItem[]> {
    const response = await this.api.get<{ data: InstructorImportLogItem[] }>('/instructores/imports', {
      params: { limit },
    });
    return response.data.data;
  }

  // Asistencias
  /** Entrar a tomar asistencia: obtiene o crea la sesión del instructor actual para la ficha. Sin elegir instructor. */
  async entrarTomarAsistencia(fichaId: number): Promise<AsistenciaResponse> {
    const response = await this.api.post<AsistenciaResponse>('/asistencias/entrar-tomar-asistencia', { ficha_id: fichaId });
    return response.data;
  }

  async createAsistenciaSesion(data: AsistenciaRequest): Promise<AsistenciaResponse> {
    const response = await this.api.post<AsistenciaResponse>('/asistencias', data);
    return response.data;
  }

  async getAsistenciaById(id: number): Promise<AsistenciaResponse> {
    const response = await this.api.get<AsistenciaResponse>(`/asistencias/${id}`);
    return response.data;
  }

  /** Dashboard de asistencia (solo superadmin). Params opcionales: sede_id, fecha (YYYY-MM-DD). */
  async getAsistenciaDashboard(params?: { sede_id?: number; fecha?: string }): Promise<AsistenciaDashboardResponse> {
    const response = await this.api.get<AsistenciaDashboardResponse>('/asistencias/dashboard', { params });
    return response.data;
  }

  /** Registros de asistencia de aprendices pendientes de revisión para el instructor actual en una fecha (default hoy). */
  async getAsistenciaPendientesRevision(fecha?: string): Promise<AsistenciaAprendizResponse[]> {
    const response = await this.api.get<{ data: AsistenciaAprendizResponse[] }>('/asistencias/pendientes-revision', {
      params: fecha ? { fecha } : undefined,
    });
    return response.data.data;
  }

  async getAsistenciasByInstructorFicha(instructorFichaId: number): Promise<AsistenciaResponse[]> {
    const response = await this.api.get<{ data: AsistenciaResponse[] }>(`/asistencias/instructor-ficha/${instructorFichaId}`);
    return response.data.data;
  }

  async getAsistenciasByFichaAndFechas(fichaId: number, fechaInicio: string, fechaFin: string): Promise<AsistenciaResponse[]> {
    const response = await this.api.get<{ data: AsistenciaResponse[] }>(`/asistencias/ficha/${fichaId}`, {
      params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
    });
    return response.data.data;
  }

  async finalizarAsistencia(id: number): Promise<AsistenciaResponse> {
    const response = await this.api.put<AsistenciaResponse>(`/asistencias/${id}/finalizar`);
    return response.data;
  }

  async getAsistenciaAprendices(asistenciaId: number): Promise<AsistenciaAprendizResponse[]> {
    const response = await this.api.get<{ data: AsistenciaAprendizResponse[] }>(`/asistencias/${asistenciaId}/aprendices`);
    return response.data.data;
  }

  async registrarIngresoAsistencia(data: AsistenciaAprendizRequest): Promise<AsistenciaAprendizResponse> {
    const response = await this.api.post<AsistenciaAprendizResponse>('/asistencias/ingreso', data);
    return response.data;
  }

  async registrarIngresoAsistenciaPorDocumento(asistenciaId: number, numeroDocumento: string): Promise<AsistenciaAprendizResponse> {
    const response = await this.api.post<AsistenciaAprendizResponse>('/asistencias/ingreso-por-documento', {
      asistencia_id: asistenciaId,
      numero_documento: numeroDocumento.trim(),
    });
    return response.data;
  }

  async registrarSalidaAsistencia(asistenciaAprendizId: number): Promise<AsistenciaAprendizResponse> {
    const response = await this.api.put<AsistenciaAprendizResponse>(`/asistencias/aprendiz/${asistenciaAprendizId}/salida`);
    return response.data;
  }

  async ajustarEstadoAsistencia(
    asistenciaAprendizId: number,
    data: { estado: string; motivo?: string }
  ): Promise<AsistenciaAprendizResponse> {
    const response = await this.api.put<AsistenciaAprendizResponse>(
      `/asistencias/aprendiz/${asistenciaAprendizId}/estado`,
      data
    );
    return response.data;
  }

  async actualizarObservacionesAsistencia(asistenciaAprendizId: number, observaciones: string): Promise<AsistenciaAprendizResponse> {
    const response = await this.api.put<AsistenciaAprendizResponse>(`/asistencias/aprendiz/${asistenciaAprendizId}/observaciones`, { observaciones });
    return response.data;
  }

  async crearOActualizarObservacionesAsistencia(asistenciaId: number, aprendizId: number, observaciones: string): Promise<AsistenciaAprendizResponse> {
    const response = await this.api.put<AsistenciaAprendizResponse>(`/asistencias/${asistenciaId}/aprendiz/${aprendizId}/observaciones`, { observaciones });
    return response.data;
  }

  // Inventario
  async getInventarioDashboard(): Promise<InventarioDashboardResponse> {
    const response = await this.api.get<InventarioDashboardResponse>('/inventario/dashboard');
    return response.data;
  }

  async getProductos(page = 1, pageSize = 20): Promise<PaginatedResponse<ProductoResponse>> {
    const response = await this.api.get<PaginatedResponse<ProductoResponse>>('/productos', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async getProductoById(id: number): Promise<ProductoResponse> {
    const response = await this.api.get<ProductoResponse>(`/productos/${id}`);
    return response.data;
  }

  async createProducto(data: ProductoCreateRequest): Promise<ProductoResponse> {
    const response = await this.api.post<ProductoResponse>('/productos', data);
    return response.data;
  }

  async updateProducto(id: number, data: ProductoUpdateRequest): Promise<ProductoResponse> {
    const response = await this.api.put<ProductoResponse>(`/productos/${id}`, data);
    return response.data;
  }

  async deleteProducto(id: number): Promise<void> {
    await this.api.delete(`/productos/${id}`);
  }

  async getOrdenes(page = 1, pageSize = 20, verTodas = false): Promise<PaginatedResponse<OrdenResponse>> {
    const response = await this.api.get<PaginatedResponse<OrdenResponse>>('/ordenes', {
      params: { page, page_size: pageSize, todas: verTodas ? '1' : undefined },
    });
    return response.data;
  }

  async getOrdenById(id: number): Promise<OrdenResponse> {
    const response = await this.api.get<OrdenResponse>(`/ordenes/${id}`);
    return response.data;
  }

  async createOrdenFromCarrito(data: OrdenFromCarritoRequest): Promise<OrdenResponse> {
    const response = await this.api.post<OrdenResponse>('/ordenes/desde-carrito', data);
    return response.data;
  }

  async getOrdenesPendientesAprobacion(page = 1, pageSize = 20): Promise<PaginatedResponse<OrdenResponse>> {
    const response = await this.api.get<PaginatedResponse<OrdenResponse>>('/ordenes/pendientes-aprobacion', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async aprobarRechazarOrden(data: AprobarRechazarRequest): Promise<void> {
    await this.api.post('/aprobaciones', data);
  }

  async createDevolucion(data: DevolucionCreateRequest): Promise<DevolucionResponse> {
    const response = await this.api.post<DevolucionResponse>('/devoluciones', data);
    return response.data;
  }

  async getProveedores(page = 1, pageSize = 50): Promise<PaginatedResponse<ProveedorResponse>> {
    const response = await this.api.get<PaginatedResponse<ProveedorResponse>>('/proveedores', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async getCategorias(): Promise<CategoriaResponse[]> {
    const response = await this.api.get<{ data: CategoriaResponse[] }>('/categorias');
    return response.data.data;
  }

  async getMarcas(): Promise<MarcaResponse[]> {
    const response = await this.api.get<{ data: MarcaResponse[] }>('/marcas');
    return response.data.data;
  }

  async getContratosConvenios(page = 1, pageSize = 50): Promise<PaginatedResponse<ContratoConvenioResponse>> {
    const response = await this.api.get<PaginatedResponse<ContratoConvenioResponse>>('/contratos-convenios', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  // --- Permisos / Usuarios (gestión roles y permisos, Casbin) ---
  async getUsuarios(offset = 0, limit = 20, search = ''): Promise<{ data: UsuarioListItem[]; total: number; offset: number; limit: number }> {
    const response = await this.api.get<{ data: UsuarioListItem[]; total: number; offset: number; limit: number }>('/usuarios', {
      params: { offset, limit, search: search || undefined },
    });
    return response.data;
  }

  async getUsuarioPermisos(userId: number): Promise<UsuarioPermisosResponse> {
    const response = await this.api.get<UsuarioPermisosResponse>(`/usuarios/${userId}/permisos`);
    return response.data;
  }

  async asignarPermiso(userId: number, obj: string, act: string): Promise<void> {
    await this.api.post(`/usuarios/${userId}/permisos`, { obj, act });
  }

  async quitarPermiso(userId: number, obj: string, act: string): Promise<void> {
    await this.api.delete(`/usuarios/${userId}/permisos/${encodeURIComponent(obj)}/${encodeURIComponent(act)}`);
  }

  async setUsuarioRoles(userId: number, roles: string[]): Promise<void> {
    await this.api.patch(`/usuarios/${userId}/roles`, { roles });
  }

  async toggleUsuarioEstado(userId: number): Promise<void> {
    await this.api.patch(`/usuarios/${userId}/estado`);
  }

  async getPermisosDefiniciones(): Promise<DefinicionesPermisosResponse> {
    const response = await this.api.get<DefinicionesPermisosResponse>('/permisos/definiciones');
    return response.data;
  }
}

export const apiService = new ApiService();
