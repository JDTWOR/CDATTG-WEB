/**
 * @module features/personalRol/config
 * @description Configuración por rol (Personal Operativo y de Apoyo / Personal Administrativo / Contratistas).
 * @author JDTWOR
 * @created 2026-08-14
 */
import type { ComponentType } from 'react';
import { ShieldCheckIcon, UsersIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';
import {
  personalOperativoApoyoPaths,
  personalAdministrativoPaths,
  contratistasPaths,
} from '../../routes/paths';
import type { PaginatedResponse } from '../../types';
import type { PersonalRolImportLogItem, PersonalRolImportResult, PersonalRolItem } from './types';

export interface PersonalRolModuleConfig {
  /** Nombre singular del rol (personal operativo y de apoyo, personal administrativo, contratista). */
  objectName: string;
  /** Ruta hacia la página de importación. */
  importPath: string;
  /** Nombre sugerido al descargar la plantilla. */
  templateFilename: string;
  /** Icono del encabezado de la página de importación. */
  importIcon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  labels: {
    title: string;
    subtitle: string;
    nuevo: string;
    crear: string;
    crearModalTitle: string;
    editarModalTitle: string;
    verModalTitle: string;
    eliminarModalTitle: string;
    eliminarConfirm: (nombre: string) => string;
    importar: string;
    importarTitle: string;
    importarDescription: string;
    nivelSingular: string;
    buenasPracticas: string[];
  };
  api: {
    list(page: number, pageSize: number, search?: string): Promise<PaginatedResponse<PersonalRolItem>>;
    create(personaId: number): Promise<PersonalRolItem>;
    update(id: number, estado: boolean): Promise<PersonalRolItem>;
    remove(id: number): Promise<void>;
    listImports(): Promise<PersonalRolImportLogItem[]>;
    upload(file: File): Promise<PersonalRolImportResult>;
    downloadTemplate(): Promise<Blob>;
  };
}

export const personalOperativoApoyoConfig: PersonalRolModuleConfig = {
  objectName: 'personal operativo y de apoyo',
  importPath: personalOperativoApoyoPaths.importar,
  templateFilename: 'plantilla_importar_personal_operativo_apoyo.xlsx',
  importIcon: ShieldCheckIcon,
  labels: {
    title: 'Personal Operativo y de Apoyo',
    subtitle: 'Gestiona y administra el personal operativo y de apoyo del SENA',
    nuevo: 'Nuevo Personal Operativo y de Apoyo',
    crear: 'Crear Personal Operativo y de Apoyo',
    crearModalTitle: 'Crear Personal Operativo y de Apoyo',
    editarModalTitle: 'Editar personal operativo y de apoyo',
    verModalTitle: 'Detalle del personal operativo y de apoyo',
    eliminarModalTitle: 'Eliminar personal operativo y de apoyo',
    eliminarConfirm: (nombre) =>
      `¿Está seguro de eliminar al personal operativo y de apoyo ${nombre}? Esta acción no se puede deshacer.`,
    importar: 'Importar personal operativo y de apoyo',
    importarTitle: 'Importar Personal Operativo y de Apoyo',
    importarDescription:
      'Carga masiva de personal operativo y de apoyo desde Excel. Se crean personas si no existen y se vinculan.',
    nivelSingular: 'personal operativo y de apoyo',
    buenasPracticas: [
      'La primera fila debe ser encabezados: NOMBRES Y APELLIDOS COMPLETO, TIPO DOCUMENTO, IDENTIFICACIÓN, NUMERO TELEFONO, CORREO PERSONAL, FECHA DE NACIMIENTO, GÉNERO.',
      'Tipo de documento: use "Cédula de Ciudadanía", "CC", o el nombre completo del tipo según el catálogo.',
      'Si la persona no existe se crea; si ya es personal operativo y de apoyo se cuenta como duplicado y no se genera error.',
    ],
  },
  api: {
    list: (page, pageSize, search) => apiService.getPersonalOperativoApoyo(page, pageSize, search),
    create: (personaId) => apiService.createPersonalOperativoApoyoFromPersona({ persona_id: personaId }),
    update: (id, estado) => apiService.updatePersonalOperativoApoyo(id, { estado }),
    remove: (id) => apiService.deletePersonalOperativoApoyo(id),
    listImports: () => apiService.getPersonalOperativoApoyoImports(50),
    upload: (file) => apiService.uploadPersonalOperativoApoyoImport(file),
    downloadTemplate: () => apiService.downloadPersonalOperativoApoyoImportTemplate(),
  },
};

export const personalAdministrativoConfig: PersonalRolModuleConfig = {
  objectName: 'personal administrativo',
  importPath: personalAdministrativoPaths.importar,
  templateFilename: 'plantilla_importar_personal_administrativo.xlsx',
  importIcon: UsersIcon,
  labels: {
    title: 'Personal Administrativo',
    subtitle: 'Gestiona y administra el personal administrativo del SENA',
    nuevo: 'Nuevo Personal Administrativo',
    crear: 'Crear Personal Administrativo',
    crearModalTitle: 'Crear Personal Administrativo',
    editarModalTitle: 'Editar personal administrativo',
    verModalTitle: 'Detalle del personal administrativo',
    eliminarModalTitle: 'Eliminar personal administrativo',
    eliminarConfirm: (nombre) =>
      `¿Está seguro de eliminar al personal administrativo ${nombre}? Esta acción no se puede deshacer.`,
    importar: 'Importar personal administrativo',
    importarTitle: 'Importar Personal Administrativo',
    importarDescription:
      'Carga masiva de personal administrativo desde Excel. Se crean personas si no existen y se vinculan.',
    nivelSingular: 'personal administrativo',
    buenasPracticas: [
      'La primera fila debe ser encabezados: NOMBRES Y APELLIDOS COMPLETO, TIPO DOCUMENTO, IDENTIFICACIÓN, NUMERO TELEFONO, CORREO PERSONAL, FECHA DE NACIMIENTO, GÉNERO.',
      'Tipo de documento: use "Cédula de Ciudadanía", "CC", o el nombre completo del tipo según el catálogo.',
      'Si la persona no existe se crea; si ya es personal administrativo se cuenta como duplicado y no se genera error.',
    ],
  },
  api: {
    list: (page, pageSize, search) => apiService.getPersonalAdministrativo(page, pageSize, search),
    create: (personaId) => apiService.createPersonalAdministrativoFromPersona({ persona_id: personaId }),
    update: (id, estado) => apiService.updatePersonalAdministrativo(id, { estado }),
    remove: (id) => apiService.deletePersonalAdministrativo(id),
    listImports: () => apiService.getPersonalAdministrativoImports(50),
    upload: (file) => apiService.uploadPersonalAdministrativoImport(file),
    downloadTemplate: () => apiService.downloadPersonalAdministrativoImportTemplate(),
  },
};

export const contratistasConfig: PersonalRolModuleConfig = {
  objectName: 'contratista',
  importPath: contratistasPaths.importar,
  templateFilename: 'plantilla_importar_contratistas.xlsx',
  importIcon: DocumentCheckIcon,
  labels: {
    title: 'Contratistas de Prestación de Servicios',
    subtitle: 'Gestiona y administra los contratistas de prestación de servicios del SENA',
    nuevo: 'Nuevo Contratista',
    crear: 'Crear Contratista',
    crearModalTitle: 'Crear Contratista',
    editarModalTitle: 'Editar contratista',
    verModalTitle: 'Detalle del contratista',
    eliminarModalTitle: 'Eliminar contratista',
    eliminarConfirm: (nombre) =>
      `¿Está seguro de eliminar al contratista ${nombre}? Esta acción no se puede deshacer.`,
    importar: 'Importar contratistas',
    importarTitle: 'Importar Contratistas',
    importarDescription:
      'Carga masiva de contratistas desde Excel. Se crean personas si no existen y se vinculan como contratistas.',
    nivelSingular: 'contratista',
    buenasPracticas: [
      'La primera fila debe ser encabezados: NOMBRES Y APELLIDOS COMPLETO, TIPO DOCUMENTO, IDENTIFICACIÓN, NUMERO TELEFONO, CORREO PERSONAL, FECHA DE NACIMIENTO, GÉNERO.',
      'Tipo de documento: use "Cédula de Ciudadanía", "CC", o el nombre completo del tipo según el catálogo.',
      'Si la persona no existe se crea; si ya es contratista se cuenta como duplicado y no se genera error.',
    ],
  },
  api: {
    list: (page, pageSize, search) => apiService.getContratistas(page, pageSize, search),
    create: (personaId) => apiService.createContratistaFromPersona({ persona_id: personaId }),
    update: (id, estado) => apiService.updateContratista(id, { estado }),
    remove: (id) => apiService.deleteContratista(id),
    listImports: () => apiService.getContratistaImports(50),
    upload: (file) => apiService.uploadContratistasImport(file),
    downloadTemplate: () => apiService.downloadContratistaImportTemplate(),
  },
};