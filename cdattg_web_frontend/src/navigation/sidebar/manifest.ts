import {
  aprendicesPaths,
  aprendizPaths,
  eleccionAprendizPaths,
  asistenciaPaths,
  bienestarPaths,
  DASHBOARD_PATH,
  fichasPaths,
  infraestructuraPaths,
  administracionPaths,
  permisosPaths,
  PERFIL_PATH,
  personasPaths,
  programasPaths,
  instructoresPaths,
  vigilanciaPaths,
} from '../../routes/paths';
import type { SidebarManifestItem } from './types';

/** Orden y agrupación del menú lateral (de arriba hacia abajo). */
export const SIDEBAR_MANIFEST: SidebarManifestItem[] = [
  // —— Inicio (accesos directos, sin acordeón) ——
  {
    section: 'Inicio',
    path: DASHBOARD_PATH,
    label: 'Panel principal',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'BIENESTAR AL APRENDIZ', 'COORDINADOR'],
    alsoVisibleForPermissions: ['VER MI AGENDA'],
    iconKey: 'dashboard',
  },
  {
    section: 'Inicio',
    path: PERFIL_PATH,
    label: 'Mi perfil',
    permission: null,
    iconKey: 'perfil',
  },
  {
    section: 'Inicio',
    path: aprendizPaths.misInasistencias,
    label: 'Mis inasistencias',
    permission: null,
    rolesRequired: ['APRENDIZ'],
    alsoVisibleForPermissions: ['VER MIS INASISTENCIAS'],
    iconKey: 'asistencia/mis-inasistencias',
  },
  {
    section: 'Inicio',
    path: eleccionAprendizPaths.index,
    label: 'Elección representante',
    permission: null,
    rolesRequired: ['APRENDIZ'],
    alsoVisibleForPermissions: ['VER ELECCION'],
    iconKey: 'eleccion/aprendiz',
  },

  // —— Formación ——
  {
    section: 'Formación',
    path: programasPaths.index,
    label: 'Programas',
    permission: 'VER PROGRAMAS',
    iconKey: 'programas',
  },
  {
    section: 'Formación',
    path: fichasPaths.index,
    label: 'Fichas',
    permission: 'VER FICHAS',
    alsoVisibleForRoles: ['INSTRUCTOR'],
    iconKey: 'fichas',
  },

  // —— Personal ——
  {
    section: 'Personal',
    path: instructoresPaths.index,
    label: 'Instructores',
    permission: 'VER FICHAS',
    iconKey: 'instructores',
  },
  {
    section: 'Personal',
    path: aprendicesPaths.index,
    label: 'Aprendices',
    permission: 'VER APRENDICES',
    iconKey: 'aprendices',
  },
  {
    section: 'Personal',
    path: personasPaths.index,
    label: 'Personas',
    permission: 'VER PERSONAS',
    iconKey: 'personas',
  },

  // —— Asistencia ——
  {
    section: 'Asistencia',
    path: asistenciaPaths.fichas,
    label: 'Tomar asistencia',
    permission: 'VER ASISTENCIA',
    iconKey: 'asistencia',
  },
  {
    section: 'Asistencia',
    path: asistenciaPaths.historial.index,
    label: 'Historial',
    permission: 'VER ASISTENCIA',
    iconKey: 'asistencia/historial',
  },
  {
    section: 'Asistencia',
    path: asistenciaPaths.sesionesSinAsistenciaTomada,
    label: 'Sin asistencia tomada',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR'],
    iconKey: 'asistencia/sin-asistencia',
  },
  {
    section: 'Asistencia',
    path: asistenciaPaths.analisis,
    label: 'Panel analítico de asistencia',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR'],
    iconKey: 'asistencia/dashboard',
  },
  {
    section: 'Asistencia',
    path: asistenciaPaths.index,
    label: 'Reporte de asistencia',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR', 'BIENESTAR AL APRENDIZ'],
    iconKey: 'asistencia/dashboard',
  },
  {
    section: 'Asistencia',
    path: asistenciaPaths.tiposObservacion,
    label: 'Tipos de observación',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR'],
    iconKey: 'asistencia/tipos-observacion',
  },

  // —— Bienestar ——
  {
    section: 'Bienestar',
    path: bienestarPaths.casos.index,
    label: 'Casos bienestar',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR', 'BIENESTAR AL APRENDIZ'],
    iconKey: 'bienestar/casos',
  },

  // —— Infraestructura ——
  {
    section: 'Infraestructura',
    path: infraestructuraPaths.sedes,
    label: 'Sedes',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR'],
    iconKey: 'infraestructura/sedes',
  },
  {
    section: 'Infraestructura',
    path: infraestructuraPaths.bloques,
    label: 'Bloques',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR'],
    iconKey: 'infraestructura/bloques',
  },
  {
    section: 'Infraestructura',
    path: infraestructuraPaths.pisos,
    label: 'Pisos',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR'],
    iconKey: 'infraestructura/pisos',
  },
  {
    section: 'Infraestructura',
    path: infraestructuraPaths.ambientes,
    label: 'Ambientes',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR'],
    iconKey: 'infraestructura/ambientes',
  },

  // —— Vigilancia ——
  {
    section: 'Vigilancia',
    path: vigilanciaPaths.ambientes,
    label: 'Ambientes en uso',
    permission: null,
    rolesRequired: ['VIGILANTE', 'SUPER ADMINISTRADOR'],
    iconKey: 'vigilancia/ambientes',
  },

  // —— Administración ——
  {
    section: 'Administración',
    path: administracionPaths.jornadas,
    label: 'Jornadas',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR'],
    iconKey: 'administracion/jornadas',
  },
  {
    section: 'Administración',
    path: administracionPaths.diasSinFormacion,
    label: 'Días sin formación',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR'],
    iconKey: 'administracion/dias-sin-formacion',
  },
  {
    section: 'Administración',
    path: administracionPaths.configuracionAsistencia,
    label: 'Config. asistencia',
    permission: null,
    rolesRequired: ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR'],
    iconKey: 'administracion/configuracion-asistencia',
  },
  {
    section: 'Administración',
    path: administracionPaths.elecciones,
    label: 'Elecciones aprendices',
    permission: 'GESTIONAR ELECCION',
    rolesRequired: ['SUPER ADMINISTRADOR', 'ADMINISTRADOR', 'COORDINADOR'],
    iconKey: 'administracion/elecciones',
  },
  {
    section: 'Administración',
    path: permisosPaths.index,
    label: 'Permisos y roles',
    permission: 'ASIGNAR PERMISOS',
    iconKey: 'permisos',
  },
];

/** Sección de accesos rápidos (sin acordeón). */
export const SIDEBAR_PRIMARY_SECTION = 'Inicio';
