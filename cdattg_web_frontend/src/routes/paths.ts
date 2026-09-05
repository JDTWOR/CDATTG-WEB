/** Raíz de navegación autenticada */
export const DASHBOARD_PATH = '/dashboard';
export const PERFIL_PATH = '/perfil';

export const personasPaths = {
  index: '/personas',
  importar: '/personas/importar',
} as const;

export const instructoresPaths = {
  index: '/instructores',
  importar: '/instructores/importar',
} as const;

export const personalOperativoApoyoPaths = {
  index: '/personal-operativo-apoyo',
  importar: '/personal-operativo-apoyo/importar',
} as const;

export const personalAdministrativoPaths = {
  index: '/personal-administrativo',
  importar: '/personal-administrativo/importar',
} as const;

export const contratistasPaths = {
  index: '/contratistas',
  importar: '/contratistas/importar',
} as const;

export const aprendicesPaths = {
  index: '/aprendices',
} as const;

export const aprendizPaths = {
  misInasistencias: '/mis-inasistencias',
  carnetDigital: '/carnet-digital',
} as const;

export const instructorPaths = {
  validarCarnet: '/instructor/validar-carnet',
} as const;

export const bibliotecaPaths = {
  carnets: '/biblioteca/carnets',
} as const;

export const programasPaths = {
  index: '/programas',
  importar: '/programas/importar',
} as const;

export const fichasPaths = {
  index: '/fichas',
  mediaTecnica: '/fichas/media-tecnica',
  complementaria: '/fichas/complementaria',
  /** Listado según tipo de formación (submódulo del menú). */
  listado: (tipoFormacion?: string | null) => {
    if (tipoFormacion === 'MEDIA_TECNICA') return '/fichas/media-tecnica';
    if (tipoFormacion === 'FORMACION_COMPLEMENTARIA') return '/fichas/complementaria';
    return '/fichas';
  },
  /** Detalle anidado en el mismo submódulo del listado (usa número de ficha, no ID interno). */
  detalle: (fichaNumero: string, tipoFormacion?: string | null) =>
    `${fichasPaths.listado(tipoFormacion)}/${encodeURIComponent(fichaNumero)}`,
} as const;

export const asistenciaPaths = {
  index: '/asistencia',
  /** Alias semántico: el dashboard vive en el index del módulo. */
  dashboard: '/asistencia',
  fichas: '/asistencia/fichas',
  sesion: (fichaId: number | string) => `/asistencia/fichas/${fichaId}/sesion`,
  historial: {
    index: '/asistencia/historial',
    ficha: (fichaId: number | string) => `/asistencia/historial/fichas/${fichaId}`,
  },
  tiposObservacion: '/asistencia/tipos-observacion',
  sesionesSinAsistenciaTomada: '/asistencia/sesiones-sin-asistencia-tomada',
  cargaRetroactiva: '/asistencia/carga-retroactiva',
  analisis: '/asistencia/analisis',
} as const;

export type BienestarCasosQuery = {
  dias?: number;
  min_fallas?: number;
  sede?: string;
  tipo_formacion?: string;
};

export type BienestarAlertasQuery = {
  dias?: number;
  sede?: string;
  tipo_formacion?: string;
};

export const bienestarPaths = {
  index: '/bienestar',
  casos: {
    index: '/bienestar/casos',
    ficha: (fichaNumero: string, query?: BienestarCasosQuery) => {
      const base = `/bienestar/casos/fichas/${encodeURIComponent(fichaNumero)}`;
      if (!query) return base;
      const params = new URLSearchParams();
      if (query.dias != null) params.set('dias', String(query.dias));
      if (query.min_fallas != null) params.set('min_fallas', String(query.min_fallas));
      if (query.sede) params.set('sede', query.sede);
      if (query.tipo_formacion) params.set('tipo_formacion', query.tipo_formacion);
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
  },
  alertasConsecutivas: {
    index: '/bienestar/alertas-consecutivas',
    ficha: (fichaNumero: string, query?: BienestarAlertasQuery) => {
      const base = `/bienestar/alertas-consecutivas/fichas/${encodeURIComponent(fichaNumero)}`;
      if (!query) return base;
      const params = new URLSearchParams();
      if (query.dias != null) params.set('dias', String(query.dias));
      if (query.sede) params.set('sede', query.sede);
      if (query.tipo_formacion) params.set('tipo_formacion', query.tipo_formacion);
      const qs = params.toString();
      return qs ? `${base}?${qs}` : base;
    },
  },
} as const;

export const inventarioPaths = {
  dashboard: '/inventario/dashboard',
  productos: '/inventario/productos',
  ordenes: {
    index: '/inventario/ordenes',
    pendientes: '/inventario/ordenes/pendientes',
    detalle: (id: number | string) => `/inventario/ordenes/${id}`,
  },
  devoluciones: '/inventario/devoluciones',
} as const;

export const vigilanciaPaths = {
  porteria: '/vigilancia/porteria',
  reporte: '/vigilancia/accesos',
  ambientes: '/vigilancia/ambientes',
  registroPersonas: '/vigilancia/registro-personas',
  cambiosPendientes: '/vigilancia/cambios-pendientes',
} as const;

export const infraestructuraPaths = {
  index: '/infraestructura',
  sedes: '/infraestructura/sedes',
  bloques: '/infraestructura/bloques',
  pisos: '/infraestructura/pisos',
  ambientes: '/infraestructura/ambientes',
} as const;

export const permisosPaths = {
  index: '/permisos',
  usuario: (userId: number | string) => `/permisos/${userId}`,
} as const;

export const administracionPaths = {
  jornadas: '/administracion/jornadas',
  diasSinFormacion: '/administracion/dias-sin-formacion',
  configuracionAsistencia: '/administracion/configuracion-asistencia',
  elecciones: '/administracion/elecciones',
  eleccionDetalle: (id: number | string) => `/administracion/elecciones/${id}`,
} as const;

export const eleccionAprendizPaths = {
  index: '/eleccion-aprendices',
} as const;

export const carnetPaths = {
  configuracion: '/carnet/configuracion',
} as const;

export const complementariosPaths = {
  index: '/complementarios',
  betowa: '/complementarios/betowa',
  consultarRegistro: '/complementarios/consultar-registro',
  inscripciones: '/complementarios/inscripciones',
} as const;
