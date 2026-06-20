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

export const aprendicesPaths = {
  index: '/aprendices',
} as const;

export const aprendizPaths = {
  misInasistencias: '/mis-inasistencias',
} as const;

export const programasPaths = {
  index: '/programas',
  importar: '/programas/importar',
} as const;

export const fichasPaths = {
  index: '/fichas',
  detalle: (fichaId: number | string) => `/fichas/${fichaId}`,
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
} as const;

export type BienestarCasosQuery = {
  dias?: number;
  min_fallas?: number;
  sede?: string;
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
  ambientes: '/vigilancia/ambientes',
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
} as const;
